from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List, Tuple

# Allow overrides from the environment so deployments can swap models/labels.
MODEL_PATH = os.getenv("MODEL_PATH")
LABELS_PATH = os.getenv("LABELS_PATH")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.50"))
CONFIDENCE_MARGIN = float(os.getenv("CONFIDENCE_MARGIN", "0.15"))
IMG_SIZE = int(os.getenv("IMG_SIZE", "224"))

# TensorFlow/Pillow/Numpy are optional at import time; guard them for tests.
try:
    from tensorflow.keras.models import load_model
    import numpy as np
    from PIL import Image
    try:
        from tensorflow.keras.applications.resnet50 import preprocess_input as resnet50_preprocess
    except Exception:  # pragma: no cover - optional depending on model family
        resnet50_preprocess = None

    TF_OK = True
except Exception:  # pragma: no cover - runtime availability guard
    TF_OK = False
    resnet50_preprocess = None


# ---------------- Paths ---------------- #
def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _default_model_path() -> Path:
    return (_repo_root() / "ml" / "model.h5").resolve()


def _default_labels_path() -> Path:
    return (_repo_root() / "ml" / "labels.txt").resolve()


# ---------------- Labels ---------------- #
def _load_labels_file(path: Path) -> List[str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    labels = [line.strip() for line in lines if line.strip()]
    if len(labels) < 2:
        raise ValueError("labels.txt must list at least two classes")
    return labels


@lru_cache(maxsize=1)
def get_labels() -> List[str]:
    path = Path(LABELS_PATH).resolve() if LABELS_PATH else _default_labels_path()
    if not path.exists():
        raise FileNotFoundError(
            f"labels.txt not found at {path}. "
            "Create ml/labels.txt with the exact class order used during training."
        )

    labels = _load_labels_file(path)
    print(f"[ml] Loaded labels from {path}: {labels}")
    return labels


# ---------------- Model ---------------- #
@lru_cache(maxsize=1)
def get_model():
    """Load and cache the Keras model, raising helpful errors if unavailable."""
    if not TF_OK:
        raise RuntimeError("TensorFlow/Pillow not available in this environment")

    path = Path(MODEL_PATH).resolve() if MODEL_PATH else _default_model_path()
    if not path.exists():
        raise FileNotFoundError(f"Model file not found at: {path}")

    print(f"[ml] Loading RiceGuard model from {path}")
    return load_model(str(path))


# ---------------- Preprocess ---------------- #
def _preprocess(image_path: str) -> "np.ndarray":
    """
    Prepare an image for inference.
    Resize to IMG_SIZE x IMG_SIZE, scale to 0-1, and add batch dimension.
    """
    img = Image.open(image_path).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
    arr = np.asarray(img, dtype="float32")
    if resnet50_preprocess:
        arr = resnet50_preprocess(arr)
    else:
        arr /= 255.0
    arr = np.expand_dims(arr, axis=0)  # (1, H, W, 3)
    return arr


# ---------------- Inference ---------------- #
def predict_image(image_path: str) -> Tuple[str, float]:
    """
    Run a prediction against the model.
    Returns (label, confidence). If confidence falls below CONFIDENCE_THRESHOLD
    we return ("uncertain", confidence) so the client can handle low-confidence
    cases gracefully.
    """
    model = get_model()
    labels = get_labels()
    tensor = _preprocess(image_path)

    preds = model.predict(tensor, verbose=0)  # shape (1, C)
    probs = np.asarray(preds[0], dtype="float32")

    # Ensure labels and model output dimensions match.
    if len(probs) != len(labels):
        raise RuntimeError(
            f"Model output dimension ({len(probs)}) does not match labels ({len(labels)}). "
            "Update ml/labels.txt or retrain/export the model with matching classes."
        )

    # Some exported models emit logits instead of probabilities.
    probs_sum = float(probs.sum())
    if (probs < 0).any() or not np.isfinite(probs_sum) or not np.isclose(probs_sum, 1.0, atol=1e-2):
        exp = np.exp(probs - probs.max())
        probs = exp / exp.sum()

    ranked_indices = probs.argsort()[::-1]
    top1 = int(ranked_indices[0])
    top2 = int(ranked_indices[1]) if len(ranked_indices) > 1 else None
    top3 = int(ranked_indices[2]) if len(ranked_indices) > 2 else None

    def _fmt(idx: int | None):
        if idx is None:
            return None
        return (labels[idx], float(probs[idx]))

    print(f"[ml] top-3: {_fmt(top1)}, {_fmt(top2)}, {_fmt(top3)}")

    confidence = float(probs[top1])
    runner_up_conf = float(probs[top2]) if top2 is not None else 0.0
    confidence_gap = confidence - runner_up_conf

    if confidence < CONFIDENCE_THRESHOLD or confidence_gap < CONFIDENCE_MARGIN:
        return "uncertain", confidence
    return labels[top1], confidence

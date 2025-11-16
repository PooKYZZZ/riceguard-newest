import os, sys, time, signal, threading, subprocess, shutil
from pathlib import Path

# ==== CONFIG (edit if your paths/ports differ) ====
REPO_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = REPO_ROOT / "backend"
FRONTEND_DIR = REPO_ROOT / "frontend"

# Backend
BACKEND_PORT = "8000"
BACKEND_APP = "app.main:app"
# Use backend/.venv if present, else system Python
VENV_PY = BACKEND_DIR / ".venv" / ("Scripts" if os.name == "nt" else "bin") / ("python.exe" if os.name == "nt" else "python")

# Frontend (React / Vite)
FRONTEND_PORT = "3000"
FRONTEND_PORT_ENV = {"PORT": FRONTEND_PORT}
FRONTEND_EXTRA_ENV = {"BROWSER": "none"}  # Prevent CRA auto-opening browser

# ==================================================
procs = []


# ===== Utility: Stream output with prefix =====
def _stream(prefix, pipe):
    for line in iter(pipe.readline, b""):
        try:
            sys.stdout.write(f"[{prefix}] {line.decode(errors='ignore')}")
        except Exception:
            pass
    pipe.close()


# ===== Utility: Spawn subprocess =====
def _spawn(cmd, cwd, env=None, prefix="proc"):
    env_full = os.environ.copy()
    if env:
        env_full.update(env)

    creationflags = 0
    start_new_session = False
    if os.name == "nt":
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        start_new_session = True

    p = subprocess.Popen(
        cmd,
        cwd=str(cwd),
        env=env_full,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=False,
        bufsize=1,
        creationflags=creationflags,
        start_new_session=start_new_session,
    )
    procs.append(p)
    threading.Thread(target=_stream, args=(prefix, p.stdout), daemon=True).start()
    return p


# ===== Backend starter =====
def start_backend():
    python_bin = str(VENV_PY if VENV_PY.exists() else sys.executable)

    # Check if we're in production mode (no reload)
    env = {}
    if os.getenv("ENVIRONMENT") == "production":
        cmd = [python_bin, "-m", "uvicorn", BACKEND_APP, "--port", BACKEND_PORT]
        print(f"→ Starting backend in PRODUCTION mode: {' '.join(cmd)}  (cwd={BACKEND_DIR})")
    else:
        cmd = [python_bin, "-m", "uvicorn", BACKEND_APP, "--reload", "--port", BACKEND_PORT]
        print(f"→ Starting backend in DEVELOPMENT mode: {' '.join(cmd)}  (cwd={BACKEND_DIR})")

    return _spawn(cmd, BACKEND_DIR, env=env, prefix="backend")


# ===== npm finder =====
def _find_npm():
    """Return absolute path to npm (Windows returns npm.cmd)."""
    npm = shutil.which("npm")
    if npm:
        return npm

    if os.name == "nt":
        guesses = [
            r"C:\Program Files\nodejs\npm.cmd",
            r"C:\Program Files (x86)\nodejs\npm.cmd",
        ]
        for g in guesses:
            if Path(g).exists():
                return g

        node_guess = Path(r"C:\Program Files\nodejs\npm.cmd")
        if node_guess.exists():
            return str(node_guess)

    # Linux/mac fallback guesses
    for g in ["/usr/local/bin/npm", "/opt/homebrew/bin/npm", "/usr/bin/npm"]:
        if Path(g).exists():
            return g

    return None


# ===== Frontend starter =====
def start_frontend():
    npm_bin = _find_npm()
    if not npm_bin:
        raise RuntimeError(
            "✗ npm not found. Make sure Node.js is installed, or update _find_npm() with your path."
        )

    env = {}
    env.update(FRONTEND_PORT_ENV)
    env.update(FRONTEND_EXTRA_ENV)

    # Ensure Node dir is on PATH (fixes venv PATH issue)
    node_dir = str(Path(npm_bin).parent)
    env["PATH"] = node_dir + os.pathsep + os.environ.get("PATH", "")

    cmd = [npm_bin, "start"]  # change to ["npm","run","dev"] if using Vite
    print(f"→ Starting frontend: {' '.join(cmd)}  (cwd={FRONTEND_DIR})")
    return _spawn(cmd, FRONTEND_DIR, env=env, prefix="frontend")


# ===== Stop all processes =====
def stop_all():
    print("\n→ Stopping processes…")
    for p in procs:
        try:
            if p.poll() is None:
                if os.name == "nt":
                    p.send_signal(signal.CTRL_BREAK_EVENT)
                    time.sleep(0.5)
                p.terminate()
        except Exception:
            pass

    deadline = time.time() + 5
    while time.time() < deadline and any(p.poll() is None for p in procs):
        time.sleep(0.1)

    for p in procs:
        if p.poll() is None:
            try:
                p.kill()
            except Exception:
                pass
    print("✓ All stopped.")


# ===== Main runner =====
def main():
    if not BACKEND_DIR.exists():
        print(f"✗ Missing backend dir: {BACKEND_DIR}")
        return
    if not FRONTEND_DIR.exists():
        print(f"✗ Missing frontend dir: {FRONTEND_DIR}")
        return

    # Check for .env file
    env_file = BACKEND_DIR / ".env"
    if not env_file.exists():
        print(f"⚠️  Warning: .env file not found at {env_file}")
        print("   Creating .env from .env.example...")
        example_file = BACKEND_DIR / ".env.example"
        if example_file.exists():
            import shutil
            shutil.copy(example_file, env_file)
            print(f"✓ Created .env from .env.example")
            print("   Please update the .env file with your configuration and restart.")
            return
        else:
            print("   Please create a .env file with your configuration.")
            return

    # Set environment based on command line args or default to development
    if len(sys.argv) > 1:
        if sys.argv[1] == "prod":
            os.environ["ENVIRONMENT"] = "production"
            print("🚀 Running in PRODUCTION mode")
        elif sys.argv[1] == "test":
            os.environ["ENVIRONMENT"] = "testing"
            print("🧪 Running in TESTING mode")
        else:
            print("🔧 Running in DEVELOPMENT mode")
    else:
        print("🔧 Running in DEVELOPMENT mode (use 'python dev_runner.py prod' for production)")

    try:
        backend_proc = start_backend()
        time.sleep(1.5)
        frontend_proc = start_frontend()

        print("\n==========================================================")
        print(f"✅ Backend → http://127.0.0.1:{BACKEND_PORT}")
        print(f"✅ Frontend → http://localhost:{FRONTEND_PORT}")
        print("Press Ctrl+C or close this window to stop both.")
        print("==========================================================\n")

        while True:
            if backend_proc.poll() is not None or frontend_proc.poll() is not None:
                raise KeyboardInterrupt
            time.sleep(0.5)

    except KeyboardInterrupt:
        pass
    finally:
        stop_all()


if __name__ == "__main__":
    main()

# Use simple ML service to avoid TensorFlow dependency issues
from .ml_service_simple import classifier, RiceDiseaseClassifier

# Uncomment to use full ML service when TensorFlow is installed:
# from .ml_service import classifier, RiceDiseaseClassifier
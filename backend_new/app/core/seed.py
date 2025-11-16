from app.core.database import get_db

def seed_recommendations():
    """Seed disease recommendations if collection is empty."""
    db = get_db()
    recommendations_collection = db.recommendations
    
    # Check if already seeded
    if recommendations_collection.count_documents({}) > 0:
        print("✓ Recommendations already seeded")
        return
    
    recommendations = [
        {
            "diseaseKey": "bacterial_blight",
            "diseaseName": "Bacterial Blight",
            "recommendations": [
                "Use resistant rice varieties",
                "Apply bactericides (copper-based products)",
                "Avoid excessive nitrogen fertilization",
                "Ensure proper field drainage",
                "Remove and destroy infected plants"
            ]
        },
        {
            "diseaseKey": "brown_spot",
            "diseaseName": "Brown Spot",
            "recommendations": [
                "Apply fungicides (propiconazole, tebuconazole)",
                "Use balanced fertilization",
                "Ensure adequate water management",
                "Remove infected plant debris",
                "Crop rotation with non-host plants"
            ]
        },
        {
            "diseaseKey": "leaf_blast",
            "diseaseName": "Leaf Blast",
            "recommendations": [
                "Apply systemic fungicides (tricyclazole, azoxystrobin)",
                "Use resistant varieties",
                "Avoid excessive nitrogen",
                "Maintain proper plant spacing",
                "Ensure good air circulation"
            ]
        },
        {
            "diseaseKey": "healthy",
            "diseaseName": "Healthy Leaf",
            "recommendations": [
                "Continue regular monitoring",
                "Maintain proper water management",
                "Apply balanced fertilization",
                "Practice good crop management",
                "Schedule regular field inspections"
            ]
        },
        {
            "diseaseKey": "tungro",
            "diseaseName": "Tungro",
            "recommendations": [
                "Control green leafhopper vectors",
                "Use tungro-resistant varieties",
                "Practice synchronous planting",
                "Remove weed hosts",
                "Apply insecticides for vector control"
            ]
        }
    ]
    
    try:
        recommendations_collection.insert_many(recommendations)
        print("✓ Disease recommendations seeded successfully")
    except Exception as e:
        print(f"⚠ Error seeding recommendations: {e}")
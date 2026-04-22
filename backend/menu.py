MENU_ITEMS = [
    {"id": "1", "name": "Paneer Tikka", "description": "Marinated cottage cheese grilled to perfection with Indian spices", "price": 249, "category": "Starters", "isVeg": True, "isBestseller": True, "rating": 4.7, "reviews": 128, "image": "/menu/paneer-tikka.png"},
    {"id": "2", "name": "Veg Spring Rolls", "description": "Crispy rolls filled with fresh vegetables and Asian seasonings", "price": 179, "category": "Starters", "isVeg": True, "isBestseller": False, "rating": 4.3, "reviews": 67, "emoji": "Ã°Å¸Â¥Â¢"},
    {"id": "3", "name": "Chicken Wings", "description": "Juicy wings tossed in our signature spicy sauce", "price": 299, "category": "Starters", "isVeg": False, "isBestseller": True, "rating": 4.8, "reviews": 215, "emoji": "Ã°Å¸Ââ€”"},
    {"id": "4", "name": "Soup of the Day", "description": "Chef's special soup served with garlic bread", "price": 149, "category": "Starters", "isVeg": True, "isBestseller": False, "rating": 4.2, "reviews": 45, "emoji": "Ã°Å¸ÂÂ²"},
    {"id": "5", "name": "Butter Chicken", "description": "Tender chicken in rich, creamy tomato-based curry", "price": 399, "category": "Mains", "isVeg": False, "isBestseller": True, "rating": 4.9, "reviews": 342, "emoji": "Ã°Å¸Ââ€º"},
    {"id": "6", "name": "Dal Makhani", "description": "Slow-cooked black lentils in a buttery gravy", "price": 299, "category": "Mains", "isVeg": True, "isBestseller": False, "rating": 4.6, "reviews": 189, "emoji": "Ã°Å¸Â«Ëœ"},
    {"id": "7", "name": "Margherita Pizza", "description": "Classic pizza with fresh mozzarella, tomatoes, and basil", "price": 349, "category": "Mains", "isVeg": True, "isBestseller": False, "rating": 4.5, "reviews": 156, "emoji": "Ã°Å¸Ââ€¢"},
    {"id": "8", "name": "Paneer Butter Masala", "description": "Cottage cheese cubes in a rich, creamy tomato gravy", "price": 329, "category": "Mains", "isVeg": True, "isBestseller": True, "rating": 4.7, "reviews": 267, "emoji": "Ã°Å¸Â§Ë†",},
    {"id": "9", "name": "Chicken Biryani", "description": "Fragrant basmati rice layered with spiced chicken", "price": 449, "category": "Mains", "isVeg": False, "isBestseller": True, "rating": 4.8, "reviews": 398, "emoji": "Ã°Å¸ÂÅ¡"},
    {"id": "10", "name": "Veg Fried Rice", "description": "Wok-tossed rice with fresh vegetables and soy sauce", "price": 249, "category": "Mains", "isVeg": True, "isBestseller": False, "rating": 4.3, "reviews": 89, "emoji": "Ã°Å¸ÂÅ“"},
    {"id": "11", "name": "Gulab Jamun", "description": "Soft milk dumplings soaked in rose-flavored sugar syrup", "price": 149, "category": "Desserts", "isVeg": True, "isBestseller": False, "rating": 4.6, "reviews": 134, "emoji": "Ã°Å¸ÂÂ©"},
    {"id": "12", "name": "Chocolate Brownie", "description": "Warm, fudgy brownie served with vanilla ice cream", "price": 199, "category": "Desserts", "isVeg": True, "isBestseller": True, "rating": 4.8, "reviews": 256, "emoji": "Ã°Å¸ÂÂ«"},
    {"id": "13", "name": "Kulfi", "description": "Traditional Indian ice cream with cardamom and pistachios", "price": 129, "category": "Desserts", "isVeg": True, "isBestseller": False, "rating": 4.4, "reviews": 78, "emoji": "Ã°Å¸ÂÂ¨"},
    {"id": "14", "name": "Mango Lassi", "description": "Refreshing yogurt-based mango smoothie", "price": 129, "category": "Drinks", "isVeg": True, "isBestseller": True, "rating": 4.7, "reviews": 189, "emoji": "Ã°Å¸Â¥Â­"},
    {"id": "15", "name": "Cold Coffee", "description": "Chilled coffee blended with ice cream", "price": 149, "category": "Drinks", "isVeg": True, "isBestseller": False, "rating": 4.5, "reviews": 145, "emoji": "Ã¢Ëœâ€¢"},
    {"id": "16", "name": "Fresh Lime Soda", "description": "Tangy lime juice with soda water", "price": 99, "category": "Drinks", "isVeg": True, "isBestseller": False, "rating": 4.3, "reviews": 67, "emoji": "Ã°Å¸Ââ€¹"},
    {"id": "17", "name": "Masala Chai", "description": "Authentic Indian spiced tea", "price": 59, "category": "Drinks", "isVeg": True, "isBestseller": False, "rating": 4.6, "reviews": 223, "emoji": "Ã°Å¸ÂÂµ"},
]

MENU_BY_ID = {item["id"]: item for item in MENU_ITEMS}
MENU_CONTEXT = "\n".join(
    f"- {item['name']} (Rs.{item['price']}, {'Veg' if item['isVeg'] else 'Non-Veg'}, {item['category']})"
    for item in MENU_ITEMS
)

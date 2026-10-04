from flask import Blueprint, jsonify, request
from backend.auth import login_required

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/ask', methods=['POST'])
@login_required
def ask():
    data = request.get_json()
    query = data.get('query')
    
    # Demo Mode
    response = "AI-assisted recommendation — faculty/admin review required.\n\n"
    response += f"Demo Mode Response to: '{query}'. In a real environment, this would process your data securely."
    
    return jsonify({'response': response})

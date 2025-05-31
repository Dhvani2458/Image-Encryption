import os
import base64
from flask import Flask, request, jsonify, render_template
from PIL import Image
import numpy as np
import io

app = Flask(__name__, static_folder='static', template_folder='templates')

def encrypt_image(image_data, key):
    """
    Encrypt an image by manipulating pixel values using the provided key
    
    Args:
        image_data: Base64 encoded image data
        key: Encryption key (integer)
        
    Returns:
        Base64 encoded encrypted image
    """
    # Decode the base64 image
    image_bytes = base64.b64decode(image_data.split(',')[1])
    image = Image.open(io.BytesIO(image_bytes))
    
    # Convert to numpy array for pixel manipulation
    pixels = np.array(image)
    
    # Create a copy to modify
    encrypted = pixels.copy()
    
    # Apply encryption: XOR operation with key and then swap RGB channels
    if len(pixels.shape) == 3 and pixels.shape[2] >= 3:  # Color image with at least 3 channels
        # XOR with key
        encrypted = encrypted ^ key
        
        # Swap R and B channels
        encrypted[:, :, [0, 2]] = encrypted[:, :, [2, 0]]
    else:  # Grayscale image
        encrypted = encrypted ^ key
    
    # Convert back to PIL Image
    encrypted_image = Image.fromarray(encrypted.astype('uint8'))
    
    # Save to bytes buffer
    buffer = io.BytesIO()
    encrypted_image.save(buffer, format="PNG")
    
    # Convert to base64 for sending to client
    encrypted_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return f"data:image/png;base64,{encrypted_base64}"

def decrypt_image(image_data, key):
    """
    Decrypt an image that was encrypted with the encrypt_image function
    
    Args:
        image_data: Base64 encoded encrypted image data
        key: Decryption key (must be the same as encryption key)
        
    Returns:
        Base64 encoded decrypted image
    """
    # Decode the base64 image
    image_bytes = base64.b64decode(image_data.split(',')[1])
    image = Image.open(io.BytesIO(image_bytes))
    
    # Convert to numpy array for pixel manipulation
    pixels = np.array(image)
    
    # Create a copy to modify
    decrypted = pixels.copy()
    
    # Apply decryption (reverse of encryption)
    if len(pixels.shape) == 3 and pixels.shape[2] >= 3:  # Color image
        # Swap R and B channels back
        decrypted[:, :, [0, 2]] = decrypted[:, :, [2, 0]]
        
        # XOR with key again to reverse
        decrypted = decrypted ^ key
    else:  # Grayscale image
        decrypted = decrypted ^ key
    
    # Convert back to PIL Image
    decrypted_image = Image.fromarray(decrypted.astype('uint8'))
    
    # Save to bytes buffer
    buffer = io.BytesIO()
    decrypted_image.save(buffer, format="PNG")
    
    # Convert to base64 for sending to client
    decrypted_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return f"data:image/png;base64,{decrypted_base64}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/encrypt', methods=['POST'])
def encrypt():
    data = request.json
    image_data = data['image']
    key = int(data['key'])
    
    try:
        encrypted_image = encrypt_image(image_data, key)
        return jsonify({'status': 'success', 'image': encrypted_image})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/decrypt', methods=['POST'])
def decrypt():
    data = request.json
    image_data = data['image']
    key = int(data['key'])
    
    try:
        decrypted_image = decrypt_image(image_data, key)
        return jsonify({'status': 'success', 'image': decrypted_image})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
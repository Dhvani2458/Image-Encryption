document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const imageInput = document.getElementById('imageInput');
    const encryptionKey = document.getElementById('encryptionKey');
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const originalImage = document.getElementById('originalImage');
    const resultImage = document.getElementById('resultImage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const statusMessage = document.getElementById('statusMessage');
    const infoToggle = document.querySelector('.info-toggle');
    const infoContent = document.querySelector('.info-content');
    
    // Variables
    let currentImage = null;
    let resultImageData = null;

    // Event listeners
    imageInput.addEventListener('change', handleImageUpload);
    encryptBtn.addEventListener('click', encryptImage);
    decryptBtn.addEventListener('click', decryptImage);
    downloadBtn.addEventListener('click', downloadResult);
    resetBtn.addEventListener('click', resetAll);
    infoToggle.addEventListener('click', toggleInfo);

    // Check initial state
    updateButtonStates();

    // Functions
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check if file is an image
        if (!file.type.match('image.*')) {
            showStatus('Please select a valid image file', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            currentImage = event.target.result;
            originalImage.src = currentImage;
            resultImage.src = "{{ url_for('static', filename='img/placeholder.png') }}";
            resultImageData = null;
            updateButtonStates();
            showStatus('Image loaded successfully', 'success');
        };
        reader.readAsDataURL(file);
    }

    function encryptImage() {
        if (!currentImage) {
            showStatus('Please upload an image first', 'error');
            return;
        }
        
        const key = parseInt(encryptionKey.value);
        if (isNaN(key) || key < 1 || key > 255) {
            showStatus('Please enter a valid key between 1 and 255', 'error');
            return;
        }
        
        processImage('/encrypt', key);
    }

    function decryptImage() {
        const key = parseInt(encryptionKey.value);
        if (isNaN(key) || key < 1 || key > 255) {
            showStatus('Please enter a valid key between 1 and 255', 'error');
            return;
        }
        
        // If there's a result image, try to decrypt that
        if (resultImageData) {
            processImage('/decrypt', key, resultImageData);
        } else if (currentImage) {
            // If no result image but we have an original, decrypt the original
            processImage('/decrypt', key);
        } else {
            showStatus('Please upload an image first', 'error');
        }
    }

    function processImage(endpoint, key, imageToProcess = null) {
        showLoading(true);
        
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: imageToProcess || currentImage,
                key: key
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                resultImageData = data.image;
                resultImage.src = data.image;
                showStatus('Image ' + (endpoint === '/encrypt' ? 'encrypted' : 'decrypted') + ' successfully', 'success');
            } else {
                showStatus('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showStatus('Error: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
            updateButtonStates();
        });
    }

    function downloadResult() {
        if (!resultImageData) {
            showStatus('No result image to download', 'error');
            return;
        }
        
        const link = document.createElement('a');
        link.href = resultImageData;
        link.download = 'encrypted_image_' + Date.now() + '.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function resetAll() {
        imageInput.value = '';
        encryptionKey.value = '42';
        originalImage.src = "{{ url_for('static', filename='img/placeholder.png') }}";
        resultImage.src = "{{ url_for('static', filename='img/placeholder.png') }}";
        currentImage = null;
        resultImageData = null;
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
        updateButtonStates();
    }

    function updateButtonStates() {
        encryptBtn.disabled = !currentImage;
        decryptBtn.disabled = !currentImage && !resultImageData;
        downloadBtn.disabled = !resultImageData;
        
        // Visual feedback for disabled state
        [encryptBtn, decryptBtn, downloadBtn].forEach(btn => {
            if (btn.disabled) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        });
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;
    }

    function showLoading(isLoading) {
        if (isLoading) {
            loadingIndicator.classList.remove('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
        }
    }

    function toggleInfo() {
        infoToggle.classList.toggle('active');
        infoContent.classList.toggle('active');
    }
});
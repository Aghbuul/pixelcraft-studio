// Initialize Feather icons
feather.replace();
import VideoExporter from './video_exporter.js';

// Initialize controls and state
const controls = {
    pixelSize: {
        slider: document.getElementById('pixelSizeSlider'),
        input: document.getElementById('pixelSizeInput'),
        decrease: document.getElementById('decreasePixelSize'),
        increase: document.getElementById('increasePixelSize')
    },
    fps: {
        slider: document.getElementById('fpsSlider'),
        input: document.getElementById('fpsInput'),
        decrease: document.getElementById('decreaseFps'),
        increase: document.getElementById('increaseFps')
    },
    interpolation: {
        slider: document.getElementById('interpolationSlider'),
        input: document.getElementById('interpolationInput'),
        decrease: document.getElementById('decreaseInterpolation'),
        increase: document.getElementById('increaseInterpolation')
    }
};

let frames = [];
let animationRunning = false;
let currentImage = null;

// Initialize canvases
const originalCanvas = document.getElementById('originalCanvas');
const pixelCanvas = document.getElementById('pixelCanvas');
const animationCanvas = document.getElementById('animationCanvas');
const spriteSheet = document.getElementById('spriteSheet');

const originalCtx = originalCanvas.getContext('2d');
const pixelCtx = pixelCanvas.getContext('2d');
const animationCtx = animationCanvas.getContext('2d');
const spriteCtx = spriteSheet.getContext('2d');

// Image upload handling
const imageInput = document.getElementById('imageInput');
imageInput.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentImage = new Image();
            currentImage.onload = function() {
                // Reset canvases
                resetCanvases();

                // Set canvas dimensions
                const { width, height } = calculateDimensions(currentImage, 400, 300);
                originalCanvas.width = width;
                originalCanvas.height = height;
                pixelCanvas.width = width;
                pixelCanvas.height = height;
                animationCanvas.width = width;
                animationCanvas.height = height;

                // Draw original image
                originalCtx.drawImage(currentImage, 0, 0, width, height);

                // Update pixelated version
                updatePixelation();
                document.getElementById('pinCurrentImage').style.display = 'inline-flex';
            };
            currentImage.src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

// Pixelation controls
function updatePixelation() {
    if (!currentImage) return;

    const pixelSize = parseInt(controls.pixelSize.slider.value);
    pixelCtx.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);

    // Create a temporary canvas for pixelation
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Set temporary canvas size
    tempCanvas.width = Math.floor(originalCanvas.width / pixelSize);
    tempCanvas.height = Math.floor(originalCanvas.height / pixelSize);

    // Draw original image scaled down
    tempCtx.drawImage(originalCanvas, 0, 0, tempCanvas.width, tempCanvas.height);

    // Draw scaled up version (pixelated)
    pixelCtx.imageSmoothingEnabled = false;
    pixelCtx.drawImage(tempCanvas, 0, 0, pixelCanvas.width, pixelCanvas.height);
    pixelCtx.imageSmoothingEnabled = true;
}

// Control sync
function syncControls(control) {
    const updateValue = (value) => {
        const clampedValue = Math.max(
            parseInt(control.slider.min),
            Math.min(parseInt(control.slider.max), value)
        );
        control.slider.value = clampedValue;
        control.input.value = clampedValue;
        if (control === controls.pixelSize) {
            updatePixelation();
        }
    };

    control.slider.addEventListener('input', (e) => updateValue(e.target.value));
    control.input.addEventListener('change', (e) => updateValue(e.target.value));
    control.decrease.addEventListener('click', () => updateValue(parseInt(control.slider.value) - 1));
    control.increase.addEventListener('click', () => updateValue(parseInt(control.slider.value) + 1));
}

// Initialize all controls
Object.values(controls).forEach(syncControls);

// Frame management
document.getElementById('addFrameBtn').addEventListener('click', () => {
    if (!currentImage) {
        alert('Please load an image first!');
        return;
    }

    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = pixelCanvas.width;
    frameCanvas.height = pixelCanvas.height;
    const frameCtx = frameCanvas.getContext('2d');
    frameCtx.drawImage(pixelCanvas, 0, 0);
    frames.push(frameCanvas);
    updateSpriteSheet();
});

function updateSpriteSheet() {
    if (frames.length === 0) return;

    const frameWidth = frames[0].width;
    const frameHeight = frames[0].height;

    spriteSheet.width = frameWidth * frames.length;
    spriteSheet.height = frameHeight;

    frames.forEach((frame, index) => {
        spriteCtx.drawImage(frame, frameWidth * index, 0);
    });
}

// Animation controls
let animationFrame;
function animate() {
    if (!animationRunning || frames.length === 0) return;

    const fps = parseInt(controls.fps.slider.value);
    const frameTime = 1000 / fps;

    let currentFrame = 0;
    let lastFrameTime = 0;

    function updateAnimation(timestamp) {
        if (timestamp - lastFrameTime >= frameTime) {
            animationCtx.clearRect(0, 0, animationCanvas.width, animationCanvas.height);
            animationCtx.drawImage(frames[currentFrame], 0, 0);
            currentFrame = (currentFrame + 1) % frames.length;
            lastFrameTime = timestamp;
        }

        if (animationRunning) {
            animationFrame = requestAnimationFrame(updateAnimation);
        }
    }

    animationFrame = requestAnimationFrame(updateAnimation);
}

document.getElementById('playAnimationBtn').addEventListener('click', () => {
    if (frames.length === 0) {
        alert('No frames to animate! Add some frames first.');
        return;
    }

    animationRunning = !animationRunning;
    const btn = document.getElementById('playAnimationBtn');

    if (animationRunning) {
        btn.innerHTML = '<i data-feather="pause"></i> Stop Animation';
        animate();
    } else {
        btn.innerHTML = '<i data-feather="play"></i> Play Animation';
        cancelAnimationFrame(animationFrame);
    }
    feather.replace();
});

function calculateDimensions(img, maxWidth, maxHeight) {
    const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
    return {
        width: Math.floor(img.width * ratio),
        height: Math.floor(img.height * ratio)
    };
}

function resetCanvases() {
    [originalCtx, pixelCtx, animationCtx, spriteCtx].forEach(ctx => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    });
}

// Reset functionality
document.getElementById('resetAllBtn').addEventListener('click', () => {
    frames = [];
    currentImage = null;
    animationRunning = false;
    resetCanvases();
    imageInput.value = '';

    // Reset all controls to default values
    controls.pixelSize.slider.value = 10;
    controls.pixelSize.input.value = 10;
    controls.fps.slider.value = 10;
    controls.fps.input.value = 10;

    document.getElementById('playAnimationBtn').innerHTML = '<i data-feather="play"></i> Play Animation';
    document.getElementById('pinCurrentImage').style.display = 'none';
    feather.replace();
});

// Dark mode toggle
document.getElementById('darkModeToggle').addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme',
        document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    );
});

// Pinned images functionality
const pinnedImagesList = document.getElementById('pinnedImagesList');
const pinCurrentImageBtn = document.getElementById('pinCurrentImage');
let pinnedImages = JSON.parse(localStorage.getItem('pinnedImages') || '[]');

function updatePinnedImagesList() {
    pinnedImagesList.innerHTML = '';
    pinnedImages.forEach((imageData, index) => {
        const div = document.createElement('div');
        div.className = 'pinned-image';
        div.innerHTML = `
            <img src="${imageData}" alt="Pinned image ${index + 1}" />
            <button class="remove-pin" title="Remove pin">×</button>
        `;

        // Load pinned image
        div.querySelector('img').addEventListener('click', () => {
            currentImage = new Image();
            currentImage.onload = function() {
                resetCanvases();
                const { width, height } = calculateDimensions(currentImage, 400, 300);
                [originalCanvas, pixelCanvas, animationCanvas].forEach(canvas => {
                    canvas.width = width;
                    canvas.height = height;
                });
                originalCtx.drawImage(currentImage, 0, 0, width, height);
                updatePixelation();
                pinCurrentImageBtn.style.display = 'inline-flex';
            };
            currentImage.src = imageData;
        });

        // Remove pin
        div.querySelector('.remove-pin').addEventListener('click', (e) => {
            e.stopPropagation();
            pinnedImages.splice(index, 1);
            localStorage.setItem('pinnedImages', JSON.stringify(pinnedImages));
            updatePinnedImagesList();
        });

        pinnedImagesList.appendChild(div);
    });
}

// Pin current image
pinCurrentImageBtn.addEventListener('click', () => {
    if (!currentImage) return;

    if (!pinnedImages.includes(currentImage.src)) {
        pinnedImages.push(currentImage.src);
        localStorage.setItem('pinnedImages', JSON.stringify(pinnedImages));
        updatePinnedImagesList();
    }
});

// Initialize pinned images
updatePinnedImagesList();


// Keyboard shortcuts
const defaultShortcuts = {
    'upload': { key: 'u', description: 'Upload Image' },
    'pixelDown': { key: 'o', description: 'Decrease Pixelation' },
    'pixelUp': { key: 'p', description: 'Increase Pixelation' },
    'addFrame': { key: 'f', description: 'Add Frame' },
    'autoFrames': { key: 'a', description: 'Auto Add Frames' },
    'fpsDown': { key: 'k', description: 'Decrease FPS' },
    'fpsUp': { key: 'l', description: 'Increase FPS' },
    'saveFrame': { key: 's', description: 'Save Frame' },
    'saveGif': { key: 'g', description: 'Save GIF' },
    'generateSheet': { key: 'h', description: 'Generate Sheet' },
    'togglePlay': { key: ' ', description: 'Play/Pause Animation' },
    'darkMode': { key: 't', description: 'Toggle Dark Mode' },
    'pinImage': { key: 'i', description: 'Pin Current Image' }
};

document.getElementById('keyboardShortcuts').addEventListener('click', () => {
    const dialog = document.createElement('dialog');
    dialog.innerHTML = `
        <div style="padding: 2rem;">
            <h3>Keyboard Shortcuts</h3>
            <div style="margin: 1rem 0; max-height: 400px; overflow-y: auto;">
                ${Object.entries(defaultShortcuts).map(([action, config]) => `
                    <div style="margin: 0.5rem 0; display: flex; justify-content: space-between; align-items: center;">
                        <span>${config.description}</span>
                        <kbd>${config.key === ' ' ? 'Space' : config.key.toUpperCase()}</kbd>
                    </div>
                `).join('')}
            </div>
            <button onclick="this.closest('dialog').close()" class="primary-button">Close</button>
        </div>
    `;
    document.body.appendChild(dialog);
    dialog.showModal();
});

// Overlay functionality
let currentOverlay = null;

// Initialize overlay canvas and context
const overlayInput = document.getElementById('overlayInput');
const overlayPreview = document.getElementById('overlayPreview');
const overlayPreviewCtx = overlayPreview.getContext('2d');

function removeWhiteBackground(canvas, tolerance = 30) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Sample corners to determine background color
    const corners = [
        {x: 0, y: 0},
        {x: canvas.width - 1, y: 0},
        {x: 0, y: canvas.height - 1},
        {x: canvas.width - 1, y: canvas.height - 1}
    ];

    // Get average corner color
    let avgR = 0, avgG = 0, avgB = 0;
    corners.forEach(corner => {
        const i = (corner.y * canvas.width + corner.x) * 4;
        avgR += data[i];
        avgG += data[i + 1];
        avgB += data[i + 2];
    });
    avgR /= 4;
    avgG /= 4;
    avgB /= 4;

    // Remove background color with tolerance
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (Math.abs(r - avgR) < tolerance &&
            Math.abs(g - avgG) < tolerance &&
            Math.abs(b - avgB) < tolerance) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

// Handle overlay image upload
overlayInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        currentOverlay = new Image();
        currentOverlay.onload = function() {
            const { width, height } = calculateDimensions(currentOverlay, 200, 120);
            overlayPreview.width = width;
            overlayPreview.height = height;
            overlayPreviewCtx.clearRect(0, 0, width, height);
            overlayPreviewCtx.drawImage(currentOverlay, 0, 0, width, height);

            if (document.getElementById('removeWhiteBackground').checked) {
                removeWhiteBackground(overlayPreview);
            }
        };
        currentOverlay.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// Generate overlay frames
document.getElementById('generateOverlayFrames').addEventListener('click', () => {
    if (!pixelCanvas.width || !pixelCanvas.height) {
        alert('Please load a base image first.');
        return;
    }

    if (!currentOverlay) {
        alert('Please load an overlay image first.');
        return;
    }

    const startOpacity = parseInt(document.getElementById('opacityStart').value) / 100;
    const endOpacity = parseInt(document.getElementById('opacityEnd').value) / 100;
    const steps = parseInt(document.getElementById('overlaySteps').value);
    const autoReverse = document.getElementById('overlayAutoReverseToggle').checked;
    const removeBackground = document.getElementById('removeWhiteBackground').checked;

    try {
        // Get the current pixelated state as the base
        const baseFrame = document.createElement('canvas');
        baseFrame.width = pixelCanvas.width;
        baseFrame.height = pixelCanvas.height;
        const baseCtx = baseFrame.getContext('2d');
        baseCtx.drawImage(pixelCanvas, 0, 0);

        // Prepare overlay with background removal if needed
        const preparedOverlay = document.createElement('canvas');
        const { width, height } = calculateDimensions(currentOverlay, pixelCanvas.width, pixelCanvas.height);
        preparedOverlay.width = width;
        preparedOverlay.height = height;
        const preparedCtx = preparedOverlay.getContext('2d');
        preparedCtx.drawImage(currentOverlay, 0, 0, width, height);

        if (removeBackground) {
            removeWhiteBackground(preparedOverlay);
        }

        // Generate forward frames
        const generateFrame = (opacity) => {
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = pixelCanvas.width;
            frameCanvas.height = pixelCanvas.height;
            const frameCtx = frameCanvas.getContext('2d');

            // Draw the base pixelated image
            frameCtx.drawImage(baseFrame, 0, 0);

            // Draw the overlay with current opacity
            frameCtx.globalAlpha = opacity;
            frameCtx.drawImage(preparedOverlay,
                (pixelCanvas.width - width) / 2,
                (pixelCanvas.height - height) / 2,
                width, height);
            frameCtx.globalAlpha = 1.0;

            return frameCanvas;
        };

        // Forward frames
        for (let i = 0; i <= steps; i++) {
            const opacity = startOpacity + (endOpacity - startOpacity) * (i / steps);
            frames.push(generateFrame(opacity));
        }

        // Reverse frames if enabled
        if (autoReverse) {
            for (let i = steps - 1; i >= 0; i--) {
                const opacity = startOpacity + (endOpacity - startOpacity) * (i / steps);
                frames.push(generateFrame(opacity));
            }
        }

        // Update sprite sheet with new frames
        updateSpriteSheet();

        const totalFrames = autoReverse ? (steps * 2 + 1) : (steps + 1);
        alert(`Successfully added ${totalFrames} overlay frames!`);
    } catch (error) {
        console.error('Error generating overlay frames:', error);
        alert('An error occurred while generating overlay frames. Please try again.');
    }
});

// Add overlay hotkey
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        document.getElementById('generateOverlayFrames').click();
    } else if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        document.getElementById('overlayInput').click();
    }
});

// Save overlay with transparency
document.getElementById('saveOverlayBtn').addEventListener('click', () => {
    if (!currentOverlay) {
        alert('Please upload an overlay image first!');
        return;
    }

    try {
        const canvas = document.createElement('canvas');
        const { width, height } = calculateDimensions(currentOverlay, 400, 300);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(currentOverlay, 0, 0, width, height);
        if (document.getElementById('removeWhiteBackground').checked) {
            removeWhiteBackground(canvas);
        }

        const link = document.createElement('a');
        link.download = 'overlay.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Error saving overlay:', error);
        alert('An error occurred while saving the overlay. Please try again.');
    }
});




//Find the dark mode toggle and add the button next to it.  This assumes the dark mode toggle has a parent element.
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle && darkModeToggle.parentElement) {
    darkModeToggle.parentElement.appendChild(shortcutButton);
}


//Export functions (reintegrated from original code)
document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!currentImage) return;

    const link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = pixelCanvas.toDataURL();
    link.click();
});

document.getElementById('saveGifBtn').innerHTML = '<i data-feather="video"></i> Save Video';
document.getElementById('saveGifBtn').title = 'Save as Video (V)';

document.getElementById('saveGifBtn').addEventListener('click', async () => {
    if (frames.length === 0) {
        alert('No frames to export! Add some frames first.');
        return;
    }

    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const loadingIndicator = document.getElementById('loadingIndicator');

    try {
        loadingIndicator.style.display = 'block';
        const fps = parseInt(document.getElementById('fpsInput').value);

        const videoExporter = new VideoExporter();
        const blob = await videoExporter.exportVideo(frames, fps, (progress) => {
            progressBar.style.width = `${progress * 100}%`;
            progressText.textContent = `${Math.round(progress * 100)}%`;
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'animation.webm';
        link.click();

        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error exporting video:', error);
        alert('Error creating video. Please try again.');
    } finally {
        loadingIndicator.style.display = 'none';
    }
});



// Frame interpolation function (reintegrated from original code)
function interpolateFrames(frame1, frame2, steps) {
    const interpolatedFrames = [];
    const ctx1 = frame1.getContext('2d');
    const ctx2 = frame2.getContext('2d');
    const imageData1 = ctx1.getImageData(0, 0, frame1.width, frame1.height);
    const imageData2 = ctx2.getImageData(0, 0, frame2.width, frame2.height);
    const data1 = imageData1.data;
    const data2 = imageData2.data;

    for (let step = 1; step < steps; step++) {
        const progress = step / steps;
        const interpolatedCanvas = document.createElement('canvas');
        interpolatedCanvas.width = frame1.width;
        interpolatedCanvas.height = frame1.height;
        const interpolatedCtx = interpolatedCanvas.getContext('2d');
        const interpolatedImageData = interpolatedCtx.createImageData(frame1.width, frame1.height);
        const interpolatedData = interpolatedImageData.data;

        for (let i = 0; i < data1.length; i += 4) {
            // Interpolate RGBA values
            interpolatedData[i] = data1[i] + (data2[i] - data1[i]) * progress;
            interpolatedData[i + 1] = data1[i + 1] + (data2[i + 1] - data1[i + 1]) * progress;
            interpolatedData[i + 2] = data1[i + 2] + (data2[i + 2] - data1[i + 2]) * progress;
            interpolatedData[i + 3] = data1[i + 3] + (data2[i + 3] - data1[i + 3]) * progress;
        }

        interpolatedCtx.putImageData(interpolatedImageData, 0, 0);
        interpolatedFrames.push(interpolatedCanvas);
    }

    return interpolatedFrames;
}

// Auto frame generation
document.getElementById('autoAddFramesBtn').addEventListener('click', () => {
    if (!originalCanvas.width || !originalCanvas.height) {
        alert('Please upload an image first!');
        return;
    }

    const start = parseInt(document.getElementById('startValue').value);
    const end = parseInt(document.getElementById('endValue').value);
    const step = parseInt(document.getElementById('stepValue').value);
    const autoReverse = document.getElementById('autoReverseToggle').checked;

    // Store original pixelation value
    const originalPixelSize = parseInt(controls.pixelSize.slider.value);

    // Forward frames
    for (let size = start; size <= end; size += step) {
        controls.pixelSize.slider.value = size;
        controls.pixelSize.input.value = size;
        updatePixelation();

        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = pixelCanvas.width;
        frameCanvas.height = pixelCanvas.height;
        const frameCtx = frameCanvas.getContext('2d');
        frameCtx.drawImage(pixelCanvas, 0, 0);
        frames.push(frameCanvas);
    }

    // Reverse frames if enabled
    if (autoReverse) {
        for (let size = end - step; size >= start; size -= step) {
            controls.pixelSize.slider.value = size;
            controls.pixelSize.input.value = size;
            updatePixelation();

            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = pixelCanvas.width;
            frameCanvas.height = pixelCanvas.height;
            const frameCtx = frameCanvas.getContext('2d');
            frameCtx.drawImage(pixelCanvas, 0, 0);
            frames.push(frameCanvas);
        }
    }

    // Restore original pixelation
    controls.pixelSize.slider.value = originalPixelSize;
    controls.pixelSize.input.value = originalPixelSize;
    updatePixelation();
    updateSpriteSheet();
});

// Clear frames button
document.getElementById('clearSpriteSheetBtn').addEventListener('click', () => {
    frames.length = 0;
    spriteCtx.clearRect(0, 0, spriteSheet.width, spriteSheet.height);
});
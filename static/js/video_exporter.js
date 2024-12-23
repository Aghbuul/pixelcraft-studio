// Video Export Configuration
const VIDEO_CONFIG = {
    mimeType: 'video/webm',
    frameRate: 30,
    videoBitsPerSecond: 2500000 // 2.5 Mbps
};

class VideoExporter {
    constructor() {
        this.isProcessing = false;
        this.mediaRecorder = null;
        this.chunks = [];
    }

    async exportVideo(frames, fps, progressCallback) {
        if (this.isProcessing) {
            throw new Error('Export already in progress');
        }

        try {
            this.isProcessing = true;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas size to match first frame
            canvas.width = frames[0].width;
            canvas.height = frames[0].height;

            // Create media stream from canvas
            const stream = canvas.captureStream(fps);

            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: VIDEO_CONFIG.mimeType,
                videoBitsPerSecond: VIDEO_CONFIG.videoBitsPerSecond
            });

            this.chunks = [];

            return new Promise((resolve, reject) => {
                this.mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        this.chunks.push(e.data);
                    }
                };

                this.mediaRecorder.onstop = () => {
                    const blob = new Blob(this.chunks, { type: VIDEO_CONFIG.mimeType });
                    this.isProcessing = false;
                    resolve(blob);
                };

                this.mediaRecorder.onerror = (error) => {
                    this.isProcessing = false;
                    reject(error);
                };

                // Start recording
                this.mediaRecorder.start();

                // Animate frames
                let frameIndex = 0;
                const frameInterval = 1000 / fps;

                const drawFrame = () => {
                    if (frameIndex >= frames.length) {
                        this.mediaRecorder.stop();
                        return;
                    }

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(frames[frameIndex], 0, 0);

                    progressCallback(frameIndex / frames.length);
                    frameIndex++;

                    setTimeout(drawFrame, frameInterval);
                };

                drawFrame();
            });

        } catch (error) {
            this.isProcessing = false;
            throw error;
        }
    }

    abort() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        this.isProcessing = false;
        this.chunks = [];
    }
}

export default VideoExporter;
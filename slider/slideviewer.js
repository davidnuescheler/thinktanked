class SlideViewer {
    constructor() {
        this.video = document.getElementById('videoPlayer');
        this.editModeBtn = document.getElementById('editModeBtn');
        this.presentModeBtn = document.getElementById('presentModeBtn');
        this.editControls = document.getElementById('editControls');
        this.presentInfo = document.getElementById('presentInfo');
        this.presentControls = document.getElementById('presentControls');
        this.addCurrentTimeBtn = document.getElementById('addCurrentTime');
        this.stopPointsList = document.getElementById('stopPointsList');
        this.currentSlideNum = document.getElementById('currentSlideNum');
        this.totalSlides = document.getElementById('totalSlides');
        this.nextStopTime = document.getElementById('nextStopTime');
        this.debugOverlay = document.getElementById('debugOverlay');
        this.debugCurrentTime = document.getElementById('debugCurrentTime');
        this.debugNextStop = document.getElementById('debugNextStop');
        
        this.mode = 'edit'; // 'edit' or 'present'
        this.stopPoints = [];
        this.currentSlideIndex = 0;
        this.isPlaying = false;
        this.debugMode = false;
        
        this.init();
    }
    
    init() {
        this.loadStopPoints();
        this.setupEventListeners();
        this.renderStopPoints();
    }
    
    setupEventListeners() {
        // Mode switching
        this.editModeBtn.addEventListener('click', () => this.switchMode('edit'));
        this.presentModeBtn.addEventListener('click', () => this.switchMode('present'));
        
        // Add stop point
        this.addCurrentTimeBtn.addEventListener('click', () => this.addStopPoint());
        
        // Video events
        this.video.addEventListener('timeupdate', () => this.handleTimeUpdate());
        this.video.addEventListener('play', () => this.isPlaying = true);
        this.video.addEventListener('pause', () => this.isPlaying = false);
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    switchMode(mode) {
        this.mode = mode;
        
        if (mode === 'edit') {
            document.body.classList.remove('present-mode');
            this.editModeBtn.classList.add('active');
            this.presentModeBtn.classList.remove('active');
            this.editControls.classList.remove('hidden');
            this.presentInfo.classList.add('hidden');
            this.presentControls.classList.add('hidden');
            this.video.controls = true;
        } else {
            document.body.classList.add('present-mode');
            this.editModeBtn.classList.remove('active');
            this.presentModeBtn.classList.add('active');
            this.editControls.classList.add('hidden');
            this.presentInfo.classList.add('hidden');
            this.presentControls.classList.add('hidden');
            this.video.controls = false;
            this.startPresentation();
        }
    }
    
    addStopPoint() {
        const currentTime = this.video.currentTime;
        
        if (!this.stopPoints.includes(currentTime)) {
            this.stopPoints.push(currentTime);
            this.stopPoints.sort((a, b) => a - b);
            this.saveStopPoints();
            this.renderStopPoints();
        }
    }
    
    removeStopPoint(time) {
        this.stopPoints = this.stopPoints.filter(t => t !== time);
        this.saveStopPoints();
        this.renderStopPoints();
    }
    
    goToStopPoint(time) {
        this.video.currentTime = time;
    }
    
    renderStopPoints() {
        if (this.stopPoints.length === 0) {
            this.stopPointsList.innerHTML = `
                <div class="empty-state">
                    <p>No stopping points yet. Play the video and click "Add Current Time" to create one.</p>
                </div>
            `;
            return;
        }
        
        this.stopPointsList.innerHTML = this.stopPoints.map(time => `
            <div class="stop-point-item">
                <span class="stop-time">${this.formatTime(time)}</span>
                <div class="stop-actions">
                    <button class="btn btn-go" onclick="slideViewer.goToStopPoint(${time})">Go</button>
                    <button class="btn btn-danger" onclick="slideViewer.removeStopPoint(${time})">Delete</button>
                </div>
            </div>
        `).join('');
        
        this.updatePresentInfo();
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    
    saveStopPoints() {
        localStorage.setItem('slideViewer_stopPoints', JSON.stringify(this.stopPoints));
    }
    
    loadStopPoints() {
        const saved = localStorage.getItem('slideViewer_stopPoints');
        if (saved) {
            this.stopPoints = JSON.parse(saved);
        }
    }
    
    startPresentation() {
        if (this.stopPoints.length === 0) {
            alert('No stopping points defined. Please add some in Edit Mode first.');
            this.switchMode('edit');
            return;
        }
        
        this.currentSlideIndex = 0;
        this.video.currentTime = 0;
        this.video.pause();
        this.updatePresentInfo();
    }
    
    handleTimeUpdate() {
        if (this.mode !== 'present' || this.stopPoints.length === 0) return;
        
        const currentTime = this.video.currentTime;
        
        // Update debug overlay if enabled
        if (this.debugMode) {
            this.updateDebugOverlay();
        }
        
        // Check if we've reached or passed the next stop point
        if (this.currentSlideIndex < this.stopPoints.length) {
            const nextStop = this.stopPoints[this.currentSlideIndex];
            
            if (currentTime >= nextStop && this.isPlaying) {
                this.video.pause();
                this.video.currentTime = nextStop; // Ensure we're at the exact stop point
                this.currentSlideIndex++; // Move to next stop for next advance
                this.updatePresentInfo();
            }
        }
    }
    
    handleKeyPress(e) {
        if (this.mode !== 'present') {
            // Allow Escape to exit present mode
            if (e.key === 'Escape' && this.mode === 'present') {
                this.switchMode('edit');
            }
            return;
        }
        
        switch(e.key) {
            case ' ': // Space
                e.preventDefault();
                this.advanceSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSlide();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousSlide();
                break;
            case 'Escape':
                e.preventDefault();
                this.switchMode('edit');
                break;
            case 'd':
            case 'D':
                e.preventDefault();
                this.toggleDebugMode();
                break;
        }
    }
    
    advanceSlide() {
        // Ignore if video is currently playing
        if (this.isPlaying) {
            return;
        }
        
        // Play to the next stop point (or end if we're past all stops)
        if (this.currentSlideIndex < this.stopPoints.length) {
            this.video.play();
        } else {
            // We've reached the end
            this.video.play();
        }
        
        this.updatePresentInfo();
    }
    
    nextSlide() {
        if (this.currentSlideIndex < this.stopPoints.length - 1) {
            this.currentSlideIndex++;
            this.video.currentTime = this.stopPoints[this.currentSlideIndex];
            this.video.pause();
            this.updatePresentInfo();
        } else if (this.currentSlideIndex === this.stopPoints.length - 1) {
            // We're at the last stop point, allow moving to the end
            this.currentSlideIndex++;
            this.video.play();
            this.updatePresentInfo();
        }
    }
    
    previousSlide() {
        if (this.currentSlideIndex > 0) {
            this.currentSlideIndex--;
            this.video.currentTime = this.stopPoints[this.currentSlideIndex];
            this.video.pause();
            this.updatePresentInfo();
        } else {
            // Go to the beginning
            this.video.currentTime = 0;
            this.video.pause();
            this.updatePresentInfo();
        }
    }
    
    updatePresentInfo() {
        this.totalSlides.textContent = this.stopPoints.length;
        this.currentSlideNum.textContent = this.currentSlideIndex + 1;
        
        if (this.currentSlideIndex < this.stopPoints.length) {
            this.nextStopTime.textContent = this.formatTime(this.stopPoints[this.currentSlideIndex]);
        } else {
            this.nextStopTime.textContent = 'End';
        }
    }
    
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        
        if (this.debugMode) {
            this.debugOverlay.classList.remove('hidden');
            this.updateDebugOverlay();
        } else {
            this.debugOverlay.classList.add('hidden');
        }
    }
    
    updateDebugOverlay() {
        this.debugCurrentTime.textContent = this.formatTime(this.video.currentTime);
        
        if (this.currentSlideIndex < this.stopPoints.length) {
            this.debugNextStop.textContent = this.formatTime(this.stopPoints[this.currentSlideIndex]);
        } else {
            this.debugNextStop.textContent = 'End';
        }
    }
}

// Initialize the app
let slideViewer;
document.addEventListener('DOMContentLoaded', () => {
    slideViewer = new SlideViewer();
});

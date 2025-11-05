// Activity Score Calculator with specific metrics
class ActivityScore {
    constructor() {
        // Define the maximum values for each metric to reach a score of 100
        this.maxValues = {
            coding: 800,        // contributions
            empathy: 2000,      // support messages
            operations: 360,    // on-call hours
            influence: 200      // channel tags
        };

        // Store raw values
        this.rawValues = {
            coding: 0,
            empathy: 0,
            operations: 0,
            influence: 0
        };

        // Store calculated scores
        this.scores = {
            coding: 0,
            empathy: 0,
            operations: 0,
            influence: 0
        };

        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        const calculateBtn = document.getElementById('calculate-btn');
        const randomizeBtn = document.getElementById('randomize-btn');
        const resetBtn = document.getElementById('reset-btn');

        calculateBtn.addEventListener('click', () => {
            this.calculateFromInputs();
        });

        randomizeBtn.addEventListener('click', () => {
            this.generateRandomData();
        });

        resetBtn.addEventListener('click', () => {
            this.resetData();
        });

        // Add input event listeners for real-time calculation
        ['coding', 'empathy', 'operations', 'influence'].forEach(metric => {
            const input = document.getElementById(`${metric}-input`);
            input.addEventListener('input', () => {
                this.calculateFromInputs();
            });
        });
    }

    loadData() {
        // Load saved data from localStorage
        const stored = localStorage.getItem('activityRawValues');
        if (stored) {
            this.rawValues = JSON.parse(stored);
            this.updateInputFields();
            this.calculateScores();
        }
    }

    saveData() {
        localStorage.setItem('activityRawValues', JSON.stringify(this.rawValues));
    }

    calculateFromInputs() {
        // Get values from input fields
        this.rawValues.coding = parseFloat(document.getElementById('coding-input').value) || 0;
        this.rawValues.empathy = parseFloat(document.getElementById('empathy-input').value) || 0;
        this.rawValues.operations = parseFloat(document.getElementById('operations-input').value) || 0;
        this.rawValues.influence = parseFloat(document.getElementById('influence-input').value) || 0;

        this.calculateScores();
        this.saveData();
        this.animateScores();
    }

    calculateScores() {
        // Calculate scores based on raw values and max values
        // Score = min(100, (rawValue / maxValue) * 100)
        this.scores.coding = Math.min(100, Math.round((this.rawValues.coding / this.maxValues.coding) * 100));
        this.scores.empathy = Math.min(100, Math.round((this.rawValues.empathy / this.maxValues.empathy) * 100));
        this.scores.operations = Math.min(100, Math.round((this.rawValues.operations / this.maxValues.operations) * 100));
        this.scores.influence = Math.min(100, Math.round((this.rawValues.influence / this.maxValues.influence) * 100));
    }

    generateRandomData() {
        // Generate random raw values (can exceed max to show >100 handling)
        this.rawValues.coding = Math.floor(Math.random() * 1200);
        this.rawValues.empathy = Math.floor(Math.random() * 3000);
        this.rawValues.operations = Math.floor(Math.random() * 500);
        this.rawValues.influence = Math.floor(Math.random() * 300);

        this.updateInputFields();
        this.calculateScores();
        this.saveData();
        this.animateScores();
    }

    resetData() {
        this.rawValues = {
            coding: 0,
            empathy: 0,
            operations: 0,
            influence: 0
        };

        this.scores = {
            coding: 0,
            empathy: 0,
            operations: 0,
            influence: 0
        };

        this.updateInputFields();
        this.saveData();
        this.animateScores();
    }

    updateInputFields() {
        document.getElementById('coding-input').value = this.rawValues.coding;
        document.getElementById('empathy-input').value = this.rawValues.empathy;
        document.getElementById('operations-input').value = this.rawValues.operations;
        document.getElementById('influence-input').value = this.rawValues.influence;
    }

    updateDisplay() {
        if (this.hasAnyData()) {
            this.animateScores();
        }
    }

    hasAnyData() {
        return this.rawValues.coding > 0 || 
               this.rawValues.empathy > 0 || 
               this.rawValues.operations > 0 || 
               this.rawValues.influence > 0;
    }

    calculateOverallScore() {
        const { coding, empathy, operations, influence } = this.scores;
        return Math.round((coding + empathy + operations + influence) / 4);
    }

    getScoreColor(score) {
        if (score >= 90) return 'green';
        if (score >= 50) return 'orange';
        return 'red';
    }

    animateScores() {
        const overall = this.calculateOverallScore();
        
        // Animate overall score
        this.animateGauge('overall', overall);
        
        // Animate individual scores
        this.animateGauge('coding', this.scores.coding);
        this.animateGauge('empathy', this.scores.empathy);
        this.animateGauge('operations', this.scores.operations);
        this.animateGauge('influence', this.scores.influence);
        
        // Update details
        this.updateDetails();
    }

    animateGauge(name, targetScore) {
        const scoreElement = document.getElementById(`${name}-score`);
        const progressElement = document.getElementById(`${name}-progress`);
        
        // Calculate stroke-dashoffset (502.65 is the circumference)
        const circumference = 502.65;
        const offset = circumference - (targetScore / 100) * circumference;
        
        // Set color
        const color = this.getScoreColor(targetScore);
        progressElement.classList.remove('score-red', 'score-orange', 'score-green');
        progressElement.classList.add(`score-${color}`);
        
        // Get current score from element
        const currentScore = parseInt(scoreElement.textContent) || 0;
        
        // Animate the number
        this.animateNumber(scoreElement, currentScore, targetScore, 1500);
        
        // Animate the progress circle
        setTimeout(() => {
            progressElement.style.strokeDashoffset = offset;
        }, 100);
    }

    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const range = end - start;
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (easeOutCubic)
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + range * eased);
            
            element.textContent = current;
            
            // Color the text
            const color = this.getScoreColor(current);
            element.classList.remove('text-red', 'text-orange', 'text-green');
            element.classList.add(`text-${color}`);
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };
        
        requestAnimationFrame(updateNumber);
    }

    updateDetails() {
        const metrics = {
            coding: {
                raw: this.rawValues.coding,
                score: this.scores.coding,
                max: this.maxValues.coding,
                unit: 'contributions'
            },
            empathy: {
                raw: this.rawValues.empathy,
                score: this.scores.empathy,
                max: this.maxValues.empathy,
                unit: 'messages'
            },
            operations: {
                raw: this.rawValues.operations,
                score: this.scores.operations,
                max: this.maxValues.operations,
                unit: 'hours'
            },
            influence: {
                raw: this.rawValues.influence,
                score: this.scores.influence,
                max: this.maxValues.influence,
                unit: 'tags'
            }
        };

        Object.keys(metrics).forEach(key => {
            const metric = metrics[key];
            const detailText = this.generateDetailText(metric);
            document.getElementById(`${key}-detail`).textContent = detailText;
        });
    }

    generateDetailText(metric) {
        const { raw, score, max, unit } = metric;
        const percentage = Math.round((raw / max) * 100);
        
        if (raw === 0) {
            return `0 ${unit} (0/100 score)`;
        }
        
        if (percentage >= 100) {
            return `${raw} ${unit} (100/100 score - ${percentage}% of target!)`;
        }
        
        return `${raw} ${unit} (${score}/100 score - ${percentage}% of ${max})`;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ActivityScore();
    });
} else {
    new ActivityScore();
}

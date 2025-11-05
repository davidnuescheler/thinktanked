# Activity Score

A Google Lighthouse-inspired visualization for measuring engineering performance across four key dimensions.

## 📊 Scoring Metrics

Each metric is measured by absolute numbers over the last 12 months, with specific targets for a perfect score of 100:

### 1. Coding Activity
- **Target:** 800 contributions = 100 score
- **Measures:** Commits, pull requests, and code contributions
- **Formula:** `score = min(100, (contributions / 800) × 100)`

### 2. Customer Empathy
- **Target:** 2000 support messages = 100 score
- **Measures:** User support engagement and customer interactions
- **Formula:** `score = min(100, (messages / 2000) × 100)`

### 3. Operations Experience
- **Target:** 360 hours = 100 score
- **Measures:** Primary on-call hours and operational responsibilities
- **Formula:** `score = min(100, (hours / 360) × 100)`

### 4. Engineering Influence
- **Target:** 200 tags = 100 score
- **Measures:** Explicit mentions in engineering channels, mentorship, and collaboration
- **Formula:** `score = min(100, (tags / 200) × 100)`

## 🎨 Score Colors

- 🟢 **Green (90-100):** Excellent performance
- 🟠 **Orange (50-89):** Good performance
- 🔴 **Red (0-49):** Needs improvement

## 🚀 Usage

1. Open `index.html` in your browser
2. Enter your raw metrics in the input fields
3. Scores calculate automatically as you type
4. Click "Calculate Scores" to update all gauges
5. Use "Generate Random Data" for testing
6. Click "Share Link" to copy/share the URL with current scores
7. Click "Reset" to clear all data

### Sharing Scores
Click the green **"Share Link"** button to:
- Copy the URL to clipboard (desktop)
- Open native share dialog (mobile)
- The URL includes all current metric values as query parameters

## 💾 Data Persistence & Sharing

### Query Parameters
All input values are automatically synced to URL query parameters, allowing you to:
- **Bookmark** specific scores
- **Share** scores via URL
- **Deep link** directly to specific metrics

Example URL:
```
index.html?coding=650&empathy=1500&operations=300&influence=150
```

The URL updates automatically as you type, using the following parameter names:
- `coding` - Coding Activity contributions
- `empathy` - Customer Empathy support messages  
- `operations` - Operations Experience on-call hours
- `influence` - Engineering Influence channel tags

### localStorage
Data is also saved to browser localStorage as a backup and will persist across page reloads.

### Priority
When loading data, the system checks in this order:
1. **URL query parameters** (highest priority)
2. **localStorage** (fallback)
3. **Empty state** (if neither exists)

## 🔧 Integration

To integrate with real data sources:

1. Modify the `loadData()` method in `activity-score.js`
2. Replace localStorage calls with API calls to your data source
3. Update the metrics as needed for your organization

Example:
```javascript
async loadData() {
    const response = await fetch('/api/activity-metrics');
    const data = await response.json();
    this.rawValues = data;
    this.updateInputFields();
    this.calculateScores();
}
```

## 📱 Responsive Design

The interface is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px-1199px)
- Mobile (320px-767px)

## 🎯 Overall Score

The overall score is calculated as the average of all four component scores:

```
Overall = (Coding + Empathy + Operations + Influence) / 4
```


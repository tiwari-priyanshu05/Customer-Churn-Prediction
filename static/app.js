// Global variables to store batch results and Chart instances
let batchScoredCSV = "";
let countryChartInstance = null;
let ageChartInstance = null;
let importanceChartInstance = null;

// Tab switcher logic
function switchTab(tabId) {
    // Hide all tab content
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });
    
    // Deactivate all tab buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    
    // Activate selected content and button
    document.getElementById(`tab-${tabId}`).classList.add("active");
    document.getElementById(`tab-${tabId}-btn`).classList.add("active");
}

// 3D Card mouse tilt effect
function init3DTilt() {
    const cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // mouse x within card
            const y = e.clientY - rect.top;  // mouse y within card
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate tilt angle (max 6 degrees to avoid excessive warping)
            const tiltX = ((centerY - y) / centerY) * 6;
            const tiltY = ((x - centerX) / centerX) * 6;
            
            // Rotate card in 3D perspective and apply offset shadow
            card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
            card.style.boxShadow = `
                ${-tiltY * 1.5}px ${tiltX * 1.5}px 35px rgba(0,0,0,0.55),
                0 0 0 1px rgba(255,255,255,0.06) inset,
                0 0 15px rgba(108, 92, 231, ${Math.abs(tiltY)/25})
            `;
        });
        
        card.addEventListener("mouseleave", () => {
            // Smoothly reset tilt
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)`;
            card.style.boxShadow = `
                0 20px 50px -12px rgba(0, 0, 0, 0.6), 
                inset 0 1px 1px rgba(255, 255, 255, 0.03)
            `;
        });
    });
}

// Update the ambient background state according to prediction
function updateAmbientBackground(riskLevel) {
    document.body.className = ""; // clear previous risk states
    if (riskLevel === "Low") {
        document.body.classList.add("risk-low");
    } else if (riskLevel === "Medium") {
        document.body.classList.add("risk-medium");
    } else if (riskLevel === "High") {
        document.body.classList.add("risk-high");
    }
}

// Update numerical values display on main form and paint range track fills
function updateFormLabels() {
    const ageInput = document.getElementById("age");
    const csInput = document.getElementById("credit_score");
    const balInput = document.getElementById("balance");
    const salInput = document.getElementById("estimated_salary");
    const tenureInput = document.getElementById("tenure");
    
    document.getElementById("age-val").innerText = ageInput.value;
    document.getElementById("credit_score-val").innerText = csInput.value;
    document.getElementById("balance-val").innerText = `$${parseFloat(balInput.value).toLocaleString()}`;
    document.getElementById("estimated_salary-val").innerText = `$${parseFloat(salInput.value).toLocaleString()}`;
    document.getElementById("tenure-val").innerText = `${tenureInput.value} ${tenureInput.value == 1 ? 'Year' : 'Years'}`;
    
    // Color fill tracks dynamically
    paintSliderTrack(ageInput);
    paintSliderTrack(csInput);
    paintSliderTrack(balInput);
    paintSliderTrack(salInput);
    paintSliderTrack(tenureInput);
}

// Calculate and paint progress track background for range sliders
function paintSliderTrack(inputElement) {
    const min = parseFloat(inputElement.min) || 0;
    const max = parseFloat(inputElement.max) || 100;
    const val = parseFloat(inputElement.value);
    const pct = ((val - min) / (max - min)) * 100;
    
    inputElement.style.background = `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${pct}%, #1e293b ${pct}%, #1e293b 100%)`;
}

// Draw Circular CSS Gauge with spring transition behavior
function setGaugeValue(percent) {
    const fillArc = document.getElementById("gauge-fill-arc");
    const riskLabel = document.getElementById("gauge-risk-val");
    
    // R = 44 -> Circumference = 276.4
    const circumference = 276.4;
    const offset = circumference - (percent / 100) * circumference;
    
    fillArc.style.strokeDashoffset = offset;
    riskLabel.innerText = `${percent.toFixed(1)}%`;
    
    // Dynamic color coding based on threshold
    if (percent < 30) {
        fillArc.style.stroke = "var(--color-success)";
    } else if (percent < 60) {
        fillArc.style.stroke = "var(--color-warning)";
    } else {
        fillArc.style.stroke = "var(--color-danger)";
    }
}

// Inline SVGs for Verdict Banner
const svgIcons = {
    Low: `<svg class="verdict-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    Medium: `<svg class="verdict-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    High: `<svg class="verdict-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
};

const recCheckedSvg = `<svg style="width: 1.3rem; height: 1.3rem; color: var(--color-primary); flex-shrink: 0; margin-top: 0.15rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;

// Handle Single Prediction submission
async function handleSinglePredict(event) {
    event.preventDefault();
    
    const form = document.getElementById("single-predict-form");
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.innerText = "⏳ Evaluating Profile...";
    submitBtn.disabled = true;
    
    // Build payload
    const payload = {
        CreditScore: parseInt(document.getElementById("credit_score").value),
        Geography: document.getElementById("geography").value,
        Gender: document.getElementById("gender").value,
        Age: parseInt(document.getElementById("age").value),
        Tenure: parseInt(document.getElementById("tenure").value),
        Balance: parseFloat(document.getElementById("balance").value),
        NumOfProducts: parseInt(document.getElementById("num_products").value),
        HasCrCard: document.getElementById("has_cr_card").checked ? 1 : 0,
        IsActiveMember: document.getElementById("is_active").checked ? 1 : 0,
        EstimatedSalary: parseFloat(document.getElementById("estimated_salary").value)
    };
    
    try {
        const response = await fetch("/api/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Prediction request failed.");
        }
        
        const data = await response.json();
        
        // Show results card
        const resultCard = document.getElementById("single-result-card");
        resultCard.classList.remove("hidden");
        
        // Set Gauge Chart
        setGaugeValue(data.churn_probability * 100);
        
        // Set Verdict Card styling and load dynamic SVG icon
        const verdictBanner = document.getElementById("verdict-status-banner");
        const verdictTitle = document.getElementById("verdict-title");
        const verdictDesc = document.getElementById("verdict-desc");
        const iconContainer = document.getElementById("verdict-icon-svg");
        
        verdictBanner.className = "verdict-banner"; // reset classes
        if (data.risk_level === "Low") {
            verdictBanner.classList.add("verdict-low");
            verdictTitle.innerText = `Low Churn Risk (${(data.churn_probability*100).toFixed(1)}%)`;
            verdictDesc.innerText = "This customer demonstrates high relationship stability. Continue standard support services.";
            iconContainer.innerHTML = svgIcons.Low;
        } else if (data.risk_level === "Medium") {
            verdictBanner.classList.add("verdict-medium");
            verdictTitle.innerText = `Moderate Churn Risk (${(data.churn_probability*100).toFixed(1)}%)`;
            verdictDesc.innerText = "Customer profile matches historical warning parameters. Proactive outreach is recommended.";
            iconContainer.innerHTML = svgIcons.Medium;
        } else {
            verdictBanner.classList.add("verdict-high");
            verdictTitle.innerText = `High Churn Risk (${(data.churn_probability*100).toFixed(1)}%)`;
            verdictDesc.innerText = "Critical exit risk flagged! Immediate priority retention tactics should be executed.";
            iconContainer.innerHTML = svgIcons.High;
        }
        
        // Key Factors list
        const factorsList = document.getElementById("risk-factors-list");
        factorsList.innerHTML = "";
        if (data.key_factors && data.key_factors.length > 0) {
            data.key_factors.forEach(fact => {
                const li = document.createElement("li");
                li.innerText = fact;
                factorsList.appendChild(li);
            });
        } else {
            const li = document.createElement("li");
            li.innerText = "No immediate negative risk anomalies flagged.";
            factorsList.appendChild(li);
        }
        
        // Recommendations checklist cards
        const recsContainer = document.getElementById("recs-list-container");
        recsContainer.innerHTML = "";
        data.recommendations.forEach(rec => {
            const div = document.createElement("div");
            div.className = "recommendation-item";
            
            // Inject check list icon and recommendation copy
            div.innerHTML = `${recCheckedSvg} <span>${rec}</span>`;
            recsContainer.appendChild(div);
        });
        
        // Update ambient background based on churn prediction model output
        updateAmbientBackground(data.risk_level);
        
        // Refresh 3D event listeners on newly generated elements
        init3DTilt();
        
        // Scroll to results smoothly
        resultCard.scrollIntoView({ behavior: 'smooth' });
        
    } catch (err) {
        alert(`Prediction Error: ${err.message}`);
    } finally {
        submitBtn.innerText = "🚀 Run Churn Analysis";
        submitBtn.disabled = false;
    }
}

// File Drag & Drop Handlers
function triggerFileInput() {
    document.getElementById("batch-file-input").click();
}

function handleFileSelected(event) {
    const file = event.target.files[0];
    if (file) {
        const label = document.getElementById("selected-file-label");
        label.innerText = `📄 Selected: ${file.name}`;
        label.classList.remove("hidden");
        document.getElementById("btn-process-batch").disabled = false;
    }
}

// Set up Drop Zone dragover visual cues
const dropZone = document.getElementById("drop-zone");
if (dropZone) {
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });
    
    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });
    
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith(".csv")) {
            document.getElementById("batch-file-input").files = e.dataTransfer.files;
            const label = document.getElementById("selected-file-label");
            label.innerText = `📄 Selected: ${file.name}`;
            label.classList.remove("hidden");
            document.getElementById("btn-process-batch").disabled = false;
        } else {
            alert("Please upload a valid CSV file.");
        }
    });
}

// Process Batch File API Query
async function processBatchFile() {
    const fileInput = document.getElementById("batch-file-input");
    const file = fileInput.files[0];
    if (!file) return;
    
    const processBtn = document.getElementById("btn-process-batch");
    processBtn.innerText = "⏳ Scoring Segment...";
    processBtn.disabled = true;
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
        const response = await fetch("/api/predict_batch", {
            method: "POST",
            body: formData
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Batch file processing failed.");
        }
        
        const data = await response.json();
        
        // Show results wrapper
        document.getElementById("batch-results-wrapper").classList.remove("hidden");
        
        // Update KPIs
        document.getElementById("kpi-total").innerText = data.kpis.total_analyzed;
        document.getElementById("kpi-churns").innerText = data.kpis.predicted_churns;
        document.getElementById("kpi-rate").innerText = `${data.kpis.average_churn_rate.toFixed(1)}%`;
        document.getElementById("kpi-high-risk").innerText = data.kpis.high_risk_count;
        
        // Store Full Scored CSV content
        batchScoredCSV = data.csv_content;
        
        // Draw country chart
        drawCountryChart(data.charts.country);
        
        // Draw age chart
        drawAgeChart(data.charts.age);
        
        // Populate Table Preview
        const tbody = document.querySelector("#batch-table tbody");
        tbody.innerHTML = "";
        data.preview.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.CreditScore}</td>
                <td>${row.Geography}</td>
                <td>${row.Gender === 1 ? "Male" : "Female"}</td>
                <td>${row.Age}</td>
                <td>${row.Tenure}</td>
                <td>$${row.Balance.toLocaleString()}</td>
                <td>${row.NumOfProducts}</td>
                <td>${row.IsActiveMember === 1 ? "Yes" : "No"}</td>
                <td><strong>${(row.ChurnProbability * 100).toFixed(1)}%</strong></td>
                <td><span class="badge-risk ${row.RiskLevel.toLowerCase()}">${row.RiskLevel}</span></td>
            `;
            tbody.appendChild(tr);
        });
        
        // Reset ambient background based on batch average rate
        const avgRate = data.kpis.average_churn_rate;
        if (avgRate < 30) {
            updateAmbientBackground("Low");
        } else if (avgRate < 60) {
            updateAmbientBackground("Medium");
        } else {
            updateAmbientBackground("High");
        }
        
        // Refresh 3D tilt listeners
        init3DTilt();
        
    } catch (err) {
        alert(`Batch Scoring Failed: ${err.message}`);
    } finally {
        processBtn.innerHTML = `<svg class="btn-icon-inside" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Process Bulk File`;
        processBtn.disabled = false;
    }
}

// Download CSV template
function downloadCSVTemplate() {
    const template = "CreditScore,Geography,Gender,Age,Tenure,Balance,NumOfProducts,HasCrCard,IsActiveMember,EstimatedSalary\n619,France,Female,42,2,0.0,1,1,1,101348.88\n608,Spain,Female,41,1,83807.86,1,0,1,112542.58\n502,France,Female,42,8,159660.8,3,1,0,113931.57";
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "customer_churn_sample.csv");
    a.click();
}

// Download Scored Results
function downloadScoredCSV() {
    if (!batchScoredCSV) return;
    const blob = new Blob([batchScoredCSV], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "scored_customers_results.csv");
    a.click();
}

// Drawing Charts (Chart.js)
function drawCountryChart(countryData) {
    if (countryChartInstance) countryChartInstance.destroy();
    
    const ctx = document.getElementById("chart-country").getContext("2d");
    countryChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: countryData.labels,
            datasets: [{
                label: 'Avg Churn Risk %',
                data: countryData.values,
                backgroundColor: ['#6c5ce7', '#8b5cf6', '#3b82f6'],
                borderColor: 'transparent',
                borderWidth: 0,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#94a3b8', callback: value => `${value}%` }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

function drawAgeChart(ageData) {
    if (ageChartInstance) ageChartInstance.destroy();
    
    const ctx = document.getElementById("chart-age").getContext("2d");
    ageChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ageData.labels,
            datasets: [{
                label: 'Avg Churn Risk %',
                data: ageData.values,
                fill: false,
                borderColor: '#6c5ce7',
                tension: 0.2,
                borderWidth: 3,
                pointBackgroundColor: '#8b5cf6',
                pointHoverBackgroundColor: '#a78bfa',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#94a3b8', callback: value => `${value}%` }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// Fetch model info from API & Draw Feature Importances
async function fetchModelInfo() {
    try {
        const response = await fetch("/api/model_info");
        if (!response.ok) throw new Error("Could not load model info.");
        const data = await response.json();
        
        drawImportanceChart(data.features, data.importances);
    } catch (err) {
        console.error("Error loading model insights:", err);
    }
}

// Horizontal Feature Importances
function drawImportanceChart(features, importances) {
    if (importanceChartInstance) importanceChartInstance.destroy();
    
    const ctx = document.getElementById("chart-importance").getContext("2d");
    importanceChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: features,
            datasets: [{
                label: 'Relative Importance Weight',
                data: importances,
                backgroundColor: '#6c5ce7',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// Real-time Sandbox Simulator
let debounceTimer;
function runSandboxSimulation() {
    // Clear debounce timer
    clearTimeout(debounceTimer);
    
    // Get values
    const ageInput = document.getElementById("sim-age");
    const balInput = document.getElementById("sim-balance");
    const prodInput = document.getElementById("sim-products");
    const active = document.querySelector("input[name='sim-active']:checked").value;
    
    // Paint tracks dynamically
    paintSliderTrack(ageInput);
    paintSliderTrack(balInput);
    paintSliderTrack(prodInput);
    
    // Update labels in real-time
    document.getElementById("sim-age-lbl").innerText = ageInput.value;
    document.getElementById("sim-balance-lbl").innerText = `$${parseFloat(balInput.value).toLocaleString()}`;
    document.getElementById("sim-products-lbl").innerText = prodInput.value;
    
    // Debounce API calls (150ms) to prevent server spamming during dragging
    debounceTimer = setTimeout(async () => {
        const payload = {
            CreditScore: 600, // Default constant
            Geography: "France", // Default constant
            Gender: "Male", // Default constant
            Age: parseInt(ageInput.value),
            Tenure: 5, // Default constant
            Balance: parseFloat(balInput.value),
            NumOfProducts: parseInt(prodInput.value),
            HasCrCard: 1, // Default constant
            IsActiveMember: parseInt(active),
            EstimatedSalary: 100000.0 // Default constant
        };
        
        try {
            const response = await fetch("/api/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) throw new Error();
            const data = await response.json();
            
            const prob = data.churn_probability * 100;
            
            // Update UI elements
            document.getElementById("sim-risk-percent").innerText = `${prob.toFixed(1)}%`;
            
            const progressBar = document.getElementById("sim-progress-bar");
            progressBar.style.width = `${prob}%`;
            
            const badge = document.getElementById("sim-risk-badge");
            badge.className = "sim-display-badge"; // reset classes
            if (data.risk_level === "Low") {
                badge.classList.add("low");
                badge.innerText = "Low Risk";
                progressBar.style.backgroundColor = "var(--color-success)";
                badge.style.boxShadow = "0 0 12px rgba(16, 185, 129, 0.25)";
            } else if (data.risk_level === "Medium") {
                badge.classList.add("medium");
                badge.innerText = "Moderate Risk";
                progressBar.style.backgroundColor = "var(--color-warning)";
                badge.style.boxShadow = "0 0 12px rgba(245, 158, 11, 0.25)";
            } else {
                badge.classList.add("high");
                badge.innerText = "High Risk";
                progressBar.style.backgroundColor = "var(--color-danger)";
                badge.style.boxShadow = "0 0 12px rgba(239, 68, 68, 0.25)";
            }
            
            // Update ambient background based on sandbox churn prediction model output!
            updateAmbientBackground(data.risk_level);
            
        } catch (err) {
            console.error("Sandbox evaluation failed.");
        }
    }, 150);
}

// Initialise features on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    updateFormLabels(); // set defaults for single prediction sliders
    fetchModelInfo();
    runSandboxSimulation();
    init3DTilt(); // start 3D tilt effects
});

// Enhanced PDF generator for PowerCalc with detailed calculation tables
// This standalone file ensures the PDF download functionality works reliably

// PDF Download functionality
function generatePDF() {
    try {
        console.log('Starting PDF generation...');
        
        // Simple helper function to ensure values are strings
        function ensureString(value) {
            if (value === null || value === undefined) return '';
            return String(value);
        }
        
        // Check if jsPDF is loaded
        if (typeof window.jspdf === 'undefined') {
            console.error("jsPDF is not loaded");
            alert("Error: PDF library not loaded. Please refresh the page and try again.");
            return;
        }
        
        // Load jsPDF
        const { jsPDF } = window.jspdf;
        
        // Get current date and time
        const today = new Date();
        
        // Get input values first with validation
        const conductorMaterialEl = document.getElementById('conductorMaterial');
        if (!conductorMaterialEl) {
            throw new Error('Conductor material element not found');
        }
        const material = conductorMaterialEl.value === 'copper' ? 'Copper' : 'Aluminum';
        
        // Cable resistance values in ohm/km for different sizes
        const cableResistanceData = {
            copper: {
                25: 0.727,
                35: 0.524,
                50: 0.387,
                70: 0.268,
                95: 0.193,
                120: 0.153,
                150: 0.124,
                185: 0.0991,
                240: 0.0754,
                300: 0.0601,
                400: 0.0470,
                500: 0.0366,
                630: 0.0283,
                800: 0.0221,
                1000: 0.0176
            },
            aluminum: {
                25: 1.20,
                35: 0.868,
                50: 0.641,
                70: 0.443,
                95: 0.320,
                120: 0.253,
                150: 0.206,
                185: 0.164,
                240: 0.125,
                300: 0.100,
                400: 0.0778,
                500: 0.0605,
                630: 0.0469,
                800: 0.0367,
                1000: 0.0291
            }
        };
        
        // Calculate voltage drop and power loss directly
        // These variables will be used throughout the PDF generation process
        var calculatedVoltageDrop = 0;
        var calculatedVoltageDropPercent = 0;
        var calculatedVoltageDropStatus = "N/A";
        var calculatedPowerLoss = 0;
        var calculatedPowerEfficiency = 100;
        
        try {
            // Get required values for calculations
            const cableLength = parseFloat(document.getElementById('cableLength').value) || 0;
            const requiredCurrent = parseFloat(document.getElementById('requiredCurrent').value) || 0;
            const supplyVoltage = parseFloat(document.getElementById('supplyVoltage').value) || 0;
            const maxVoltageDrop = parseFloat(document.getElementById('maxVoltageDrop').value) || 5;
            const size = parseFloat(document.getElementById('conductorSize').value) || 0;
            const circuits = parseInt(document.getElementById('numberOfCircuits').value) || 1;
            const constructionValue = document.getElementById('cableConstruction').value;
            const materialValue = document.getElementById('conductorMaterial').value;
            
            // Get resistance value from the data or calculate it
            let resistancePerKm = 0;
            const materialKey = materialValue.toLowerCase();
            
            // Try to get the resistance from the lookup table
            if (cableResistanceData && cableResistanceData[materialKey] && cableResistanceData[materialKey][size]) {
                resistancePerKm = cableResistanceData[materialKey][size];
            } else {
                // Fallback: Calculate resistance based on material and size
                const resistivityValue = materialKey === 'copper' ? 1.72e-8 : 2.82e-8; // Ω·m
                resistancePerKm = resistivityValue * 1000 / (size * 1e-6); // Convert to Ω/km
            }
            const resistanceTotal = resistancePerKm * cableLength / 1000; // Convert to ohms
            
            // Calculate voltage drop
            if (supplyVoltage > 0 && size > 0 && requiredCurrent > 0) {
                const currentPerCircuit = requiredCurrent / circuits;
                calculatedVoltageDrop = currentPerCircuit * resistanceTotal;
                
                // For three phase
                if (constructionValue === 'threeCore' || (constructionValue === 'singleCore' && circuits >= 3)) {
                    calculatedVoltageDrop = Math.sqrt(3) * calculatedVoltageDrop;
                }
                
                calculatedVoltageDropPercent = (calculatedVoltageDrop / supplyVoltage) * 100;
                calculatedVoltageDropStatus = calculatedVoltageDropPercent <= maxVoltageDrop ? "✓ PASS" : "✗ FAIL";
            }
            
            // Calculate power loss
            if (requiredCurrent > 0 && size > 0) {
                const currentPerCircuit = requiredCurrent / circuits;
                let powerLossPerCircuit = 0;
                
                if (constructionValue === 'threeCore' || (constructionValue === 'singleCore' && circuits >= 3)) {
                    // Three-phase power loss per circuit
                    powerLossPerCircuit = 3 * Math.pow(currentPerCircuit, 2) * resistanceTotal;
                } else {
                    // Single-phase power loss per circuit
                    powerLossPerCircuit = Math.pow(currentPerCircuit, 2) * resistanceTotal;
                }
                
                // Total power loss across all circuits
                calculatedPowerLoss = powerLossPerCircuit * circuits / 1000; // Convert to kW
                
                // Calculate efficiency
                const apparentPower = supplyVoltage * requiredCurrent * 
                    (constructionValue === 'threeCore' || (constructionValue === 'singleCore' && circuits >= 3) ? Math.sqrt(3) : 1) / 1000; // kVA
                
                calculatedPowerEfficiency = apparentPower > 0 ? 100 - (calculatedPowerLoss / apparentPower * 100) : 100;
            }
            
            // Update UI elements with calculated values
            const voltageDropEl = document.getElementById('voltageDropValue');
            if (voltageDropEl) voltageDropEl.textContent = calculatedVoltageDrop.toFixed(2) + ' V';
            
            const voltageDropPercentEl = document.getElementById('voltageDropPercent');
            if (voltageDropPercentEl) voltageDropPercentEl.textContent = calculatedVoltageDropPercent.toFixed(2) + '%';
            
            const voltageDropStatusEl = document.getElementById('voltageDropStatus');
            if (voltageDropStatusEl) {
                if (calculatedVoltageDropStatus.includes('PASS')) {
                    voltageDropStatusEl.textContent = '✓ Within limits';
                    voltageDropStatusEl.className = 'font-medium text-green-600';
                } else if (calculatedVoltageDropStatus.includes('FAIL')) {
                    voltageDropStatusEl.textContent = '✗ Exceeds limits';
                    voltageDropStatusEl.className = 'font-medium text-red-600';
                } else {
                    voltageDropStatusEl.textContent = 'N/A';
                    voltageDropStatusEl.className = 'font-medium';
                }
            }
            
            const powerLossEl = document.getElementById('powerLossValue');
            if (powerLossEl) powerLossEl.textContent = calculatedPowerLoss.toFixed(2) + ' kW';
            
            const powerEfficiencyEl = document.getElementById('powerEfficiency');
            if (powerEfficiencyEl) powerEfficiencyEl.textContent = calculatedPowerEfficiency.toFixed(2) + '%';
            
            console.log('Calculated values:', { 
                voltageDrop: calculatedVoltageDrop, 
                voltageDropPercent: calculatedVoltageDropPercent, 
                voltageDropStatus: calculatedVoltageDropStatus, 
                powerLoss: calculatedPowerLoss, 
                powerEfficiency: calculatedPowerEfficiency 
            });
        } catch (e) {
            console.error('Error calculating values:', e);
        }
        
        const cableConstructionEl = document.getElementById('cableConstruction');
        if (!cableConstructionEl) {
            throw new Error('Cable construction element not found');
        }
        const construction = cableConstructionEl.value === 'singleCore' ? 'Single-Core' : 'Three-Core';
        
        const sizeEl = document.getElementById('conductorSize');
        if (!sizeEl) {
            throw new Error('Conductor size element not found');
        }
        const size = sizeEl.value;
        
        const voltageEl = document.getElementById('voltageRating');
        if (!voltageEl) {
            throw new Error('Voltage rating element not found');
        }
        const voltage = voltageEl.value;
        
        const installationEl = document.getElementById('installationType');
        if (!installationEl) {
            throw new Error('Installation type element not found');
        }
        const installation = installationEl.value === 'inAir' ? 'In Air' : 'Direct Buried';
        
        const temperatureEl = document.getElementById('temperature');
        if (!temperatureEl) {
            throw new Error('Temperature element not found');
        }
        const temperature = temperatureEl.value;
        
        const requiredCurrentEl = document.getElementById('requiredCurrent');
        if (!requiredCurrentEl) {
            throw new Error('Required current element not found');
        }
        const requiredCurrent = requiredCurrentEl.value || '0';
        
        const cableLengthEl = document.getElementById('cableLength');
        if (!cableLengthEl) {
            throw new Error('Cable length element not found');
        }
        const cableLength = cableLengthEl.value || '0';
        
        const supplyVoltageEl = document.getElementById('supplyVoltage');
        if (!supplyVoltageEl) {
            throw new Error('Supply voltage element not found');
        }
        const supplyVoltage = supplyVoltageEl.value || '0';
        
        const shortCircuitCurrentEl = document.getElementById('shortCircuitValue');
        if (!shortCircuitCurrentEl) {
            throw new Error('Short circuit current element not found');
        }
        const shortCircuitCurrent = shortCircuitCurrentEl.textContent;
        
        const faultDurationEl = document.getElementById('faultDuration');
        if (!faultDurationEl) {
            throw new Error('Fault duration element not found');
        }
        const faultDuration = faultDurationEl.value || '1';
        
        // Get result values with validation
        const baseRatingEl = document.getElementById('baseRatingValue');
        if (!baseRatingEl) {
            throw new Error('Base rating element not found');
        }
        const baseRating = baseRatingEl.textContent;
        
        // Define cable electrical properties - will be calculated more precisely later
        let cableResistance = 0;
        let cableReactance = 0.08; // Standard reactance value for power cables
        
        const totalDeratingEl = document.getElementById('totalDeratingFactor');
        if (!totalDeratingEl) {
            throw new Error('Total derating factor element not found');
        }
        const totalDerating = totalDeratingEl.textContent;
        
        const finalRatingEl = document.getElementById('finalRatingValue');
        if (!finalRatingEl) {
            throw new Error('Final rating element not found');
        }
        const finalRating = finalRatingEl.textContent;
        
        const recommendedSizeEl = document.getElementById('recommendedSize');
        if (!recommendedSizeEl) {
            throw new Error('Recommended size element not found');
        }
        const recommendedSize = recommendedSizeEl.textContent;
        
        const safetyMarginEl = document.getElementById('safetyMargin');
        if (!safetyMarginEl) {
            throw new Error('Safety margin element not found');
        }
        const safetyMargin = safetyMarginEl.textContent;
        
        const shortCircuitWithstandEl = document.getElementById('shortCircuitWithstand');
        if (!shortCircuitWithstandEl) {
            throw new Error('Short circuit withstand element not found');
        }
        const shortCircuitWithstand = shortCircuitWithstandEl.textContent;
        
        const shortCircuitStatusEl = document.getElementById('shortCircuitStatus');
        if (!shortCircuitStatusEl) {
            throw new Error('Short circuit status element not found');
        }
        const shortCircuitStatus = shortCircuitStatusEl.textContent;
        
        // We've already calculated these values directly, no need to read from DOM
        // Use the calculated values directly for the PDF generation
        const voltageDrop = calculatedVoltageDrop.toFixed(2) + ' V';
        const voltageDropPercent = calculatedVoltageDropPercent.toFixed(2) + '%';
        const voltageDropStatus = calculatedVoltageDropStatus;
        const powerLoss = calculatedPowerLoss.toFixed(2) + ' kW';
        const powerEfficiency = calculatedPowerEfficiency.toFixed(2) + '%';
        
        // Create a new PDF document
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Professional engineering report colors
        const colors = {
            header: { r: 0, g: 32, b: 96 },       // Dark blue for headers (professional engineering blue)
            subheader: { r: 31, g: 73, b: 125 },  // Medium blue for subheaders
            pass: { r: 0, g: 176, b: 80 },        // Green for pass status
            fail: { r: 192, g: 0, b: 0 },         // Dark red for fail status (less harsh)
            table: { r: 180, g: 198, b: 231 },    // Light blue for table headers
            tableAlt: { r: 222, g: 234, b: 246 },  // Lighter blue for alternating rows
            border: { r: 166, g: 166, b: 166 },   // Border color
            gridLine: { r: 217, g: 217, b: 217 }, // Grid line color
            chartBg: { r: 242, g: 242, b: 242 }   // Chart background
        };
        
        // Add company logo and information
        const companyName = "PowerCalc";
        const companyTagline = "Power Plant Engineering Solutions";
        const reportTitle = "Cable Current Rating Report";
        const reportDate = today.toLocaleDateString();
        const reportTime = today.toLocaleTimeString();
        
        // Set document properties
        pdf.setProperties({
            title: companyName + " - " + reportTitle,
            subject: "Cable Current Rating Analysis",
            author: companyName,
            keywords: "power plant, cable rating, voltage drop, power loss, engineering",
            creator: companyName
        });
        
        // Create a compact header with company info
        pdf.setFillColor(colors.header.r, colors.header.g, colors.header.b);
        pdf.rect(0, 0, 210, 20, 'F');
        
        // Add company name and report title
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(companyName.toUpperCase() + ' - ' + reportTitle, 105, 12, { align: 'center' });
        
        // Project information in a compact box
        pdf.setFillColor(colors.tableAlt.r, colors.tableAlt.g, colors.tableAlt.b);
        pdf.rect(15, 25, 180, 25, 'F');
        pdf.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
        pdf.rect(15, 25, 180, 25, 'S');
        
        // Project details in a compact format
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Cable: ' + material + ' ' + construction + ', ' + voltage + ', ' + size + ' mm²', 20, 33);
        pdf.text('Installation: ' + installation + ' | Length: ' + cableLength + ' m | Generated: ' + reportDate, 20, 43);
        
        // Set starting position for content
        let y = 55;
        
        // Add professional header to each page
        function addPageHeader(pdf) {
            // Header bar
            pdf.setFillColor(colors.header.r, colors.header.g, colors.header.b);
            pdf.rect(0, 0, 210, 15, 'F');
            
            // Header text
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(companyName + ' - ' + reportTitle, 15, 10);
            
            // Page number
            pdf.text('Page ' + pdf.internal.getNumberOfPages(), 195, 10, { align: 'right' });
            
            // Reset text format
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');
        }
        
        // Add header to the new page
        addPageHeader(pdf);
        
        // These variables are already declared at the top of the function
        
        // Helper function to create compact table headers
        function createTableHeader(pdf, title, y, pageWidth = 180) {
            // Add a page break if we're too close to the bottom
            if (y > 250) {
                pdf.addPage();
                addPageHeader(pdf);
                y = 30; // Reset y position after new page
            }
            
            // Draw header background
            pdf.setFillColor(colors.subheader.r, colors.subheader.g, colors.subheader.b);
            pdf.rect(15, y, pageWidth, 8, 'F');
            
            // Add border
            pdf.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
            pdf.rect(15, y, pageWidth, 8, 'S');
            
            // Add header text
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(title, 17, y + 5.5);
            
            // Reset text format
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            
            return y + 8;
        }
        
        // Helper function to add page footer
        function addPageFooter(pdf) {
            const pageHeight = pdf.internal.pageSize.height;
            
            // Add footer line
            pdf.setDrawColor(colors.header.r, colors.header.g, colors.header.b);
            pdf.setLineWidth(0.5);
            pdf.line(15, pageHeight - 15, 195, pageHeight - 15);
            
            // Add footer text
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text(companyName + ' \u00b7 ' + companyTagline, 105, pageHeight - 10, { align: 'center' });
            pdf.text('Page ' + pdf.internal.getNumberOfPages(), 195, pageHeight - 10, { align: 'right' });
            pdf.text(reportDate, 15, pageHeight - 10);
        }
        
        // Section 1: Cable Specifications
        y = createTableHeader(pdf, 'Cable Specifications', y);
        
        // Create compact specification table - 2 columns x 3 rows
        pdf.setFillColor(colors.tableAlt.r, colors.tableAlt.g, colors.tableAlt.b);
        pdf.rect(15, y, 180, 30, 'F');
        pdf.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
        pdf.rect(15, y, 180, 30, 'S');
        
        // Add grid lines
        pdf.setDrawColor(colors.gridLine.r, colors.gridLine.g, colors.gridLine.b);
        pdf.line(105, y, 105, y + 30); // Vertical divider
        pdf.line(15, y + 10, 195, y + 10); // Horizontal divider
        pdf.line(15, y + 20, 195, y + 20); // Horizontal divider
        
        // Add content with smaller font
        pdf.setFontSize(8);
        
        // Row 1
        pdf.text('AC Voltage: ' + voltage, 18, y + 7);
        pdf.text('Material: ' + material, 108, y + 7);
        
        // Row 2
        pdf.text('Size: ' + size + ' mm\u00b2', 18, y + 17);
        pdf.text('Installation: ' + installation, 108, y + 17);
        
        // Row 3 - Add cable electrical properties
        // Simplified reactance value based on cable size (defined once at the top level)
        pdf.text('Resistance: ' + cableResistance.toFixed(3) + ' Ω/km', 18, y + 27);
        pdf.text('Reactance: ' + cableReactance.toFixed(3) + ' Ω/km', 108, y + 27);
        
        y += 25; // Reduced spacing after table
        // Section 2: Current Rating Calculation
        y = createTableHeader(pdf, 'Current Rating Calculation Results', y);
        
        // Create current rating table with all derating factors
        pdf.setFillColor(colors.tableAlt.r, colors.tableAlt.g, colors.tableAlt.b);
        pdf.rect(15, y, 180, 90, 'F');
        
        pdf.setFontSize(10);
        pdf.text('Continuous Current Rating of the selected cable in', 20, y + 8);
        pdf.text('Current at 40°C in air', 110, y + 8);
        pdf.text('=', 170, y + 8);
        pdf.text(baseRating, 175, y + 8);
        
        // Show all derating factors as in the image
        pdf.text('Derating Due to Ambient Air Temperature', 20, y + 16);
        pdf.text('=', 170, y + 16);
        pdf.text(document.getElementById('temperatureFactorValue').textContent, 175, y + 16);
        
        // Add depth factor if applicable
        if (installation !== 'In Air') {
            pdf.text('Derating Due to Depth of Laying', 20, y + 24);
            pdf.text('=', 170, y + 24);
            pdf.text(document.getElementById('depthFactorValue')?.textContent || '1.00', 175, y + 24);
        }
        
        // Add soil resistivity factor if applicable
        if (installation !== 'In Air') {
            pdf.text('Due to Soil Resistivity', 20, y + 32);
            pdf.text('=', 170, y + 32);
            pdf.text(document.getElementById('resistivityFactorValue')?.textContent || '1.00', 175, y + 32);
        }
        
        // Add grouping factor
        pdf.text('Derating Due to Grouping', 20, y + 40);
        pdf.text('=', 170, y + 40);
        pdf.text(document.getElementById('groupingFactorValue')?.textContent || '1.00', 175, y + 40);
        
        // Overall derating factor
        pdf.text('Overall Derating Factor', 20, y + 56);
        pdf.text('=', 170, y + 56);
        pdf.text(totalDerating, 175, y + 56);
        
        // Derated cable current
        pdf.text('Derated cable current for 1Nos of runs', 20, y + 64);
        pdf.text('=', 170, y + 64);
        pdf.text(finalRating.replace(' × ', ' x '), 175, y + 64);
        
        // Operating current per cable run/phase
        pdf.text('Operating current per cable run/phase', 20, y + 72);
        pdf.text('=', 170, y + 72);
        const operatingCurrent = parseFloat(requiredCurrent) / parseInt(document.getElementById('numberOfCircuits').value || 1);
        pdf.text(operatingCurrent.toFixed(1) + ' A', 175, y + 72);
        
        // Resistance of the selected cable
        pdf.text('Resistance of the selected Cable at 90°C', 20, y + 80);
        pdf.text('=', 170, y + 80);
        // Calculate resistance based on cable size
        cableResistance = material === 'Copper' ? (0.018 * 1000 / parseInt(size)) : (0.028 * 1000 / parseInt(size));
        pdf.text(cableResistance.toFixed(3) + ' Ohm/Km', 175, y + 80);
        
        // Section 3: Voltage Drop Analysis
        y = 185;
        y = createTableHeader(pdf, 'Voltage Drop Analysis', y);
        
        // Create voltage drop table with detailed calculations
        pdf.setFillColor(colors.tableAlt.r, colors.tableAlt.g, colors.tableAlt.b);
        pdf.rect(15, y, 180, 80, 'F');
        
        pdf.setFontSize(10);
        pdf.text('Based on voltage drop:', 20, y + 8);
        
        // Formula with better formatting
        pdf.text('%Vd = ', 20, y + 16);
        pdf.text('√3 × IL × (R cosθ + X sinθ) × L × 100', 40, y + 16);
        pdf.text('N × V', 40, y + 24);
        
        // Draw a line for the division
        pdf.setLineWidth(0.5);
        pdf.line(40, y + 18, 130, y + 18);
        
        // Parameters for voltage drop calculation
        pdf.text('IL = Full Load Current', 20, y + 32);
        pdf.text('=', 100, y + 32);
        pdf.text(requiredCurrent + ' Amps', 110, y + 32);
        
        pdf.text('N = No. Runs/phase', 20, y + 40);
        pdf.text('=', 100, y + 40);
        pdf.text(document.getElementById('numberOfCircuits').value || '1', 110, y + 40);
        
        pdf.text('Inverter Transformer secondary voltage', 20, y + 48);
        pdf.text('=', 100, y + 48);
        pdf.text(supplyVoltage + ' Volts', 110, y + 48);
        
        pdf.text('Resistance of the selected Cable at 90 Deg. Cel.', 20, y + 56);
        pdf.text('=', 100, y + 56);
        pdf.text(cableResistance.toFixed(3) + ' Ohm/Km', 110, y + 56);
        
        pdf.text('X= Reactance of the Cable in Ohm/Km', 20, y + 64);
        pdf.text('=', 100, y + 64);
        // Use the reactance value defined earlier
        pdf.text(cableReactance.toFixed(3) + ' Ohm/Km', 110, y + 64);
        
        pdf.text('L = Length of the Cable in Km.', 20, y + 72);
        pdf.text('=', 100, y + 72);
        pdf.text((parseFloat(cableLength) / 1000).toFixed(3) + ' Km', 110, y + 72);
        
        // Results
        y += 80;
        pdf.setFillColor(colors.tableAlt.r, colors.tableAlt.g, colors.tableAlt.b);
        pdf.rect(15, y, 180, 30, 'F');
        
        pdf.text('Voltage Drop', 20, y + 8);
        pdf.text('=', 100, y + 8);
        pdf.text(voltageDrop, 110, y + 8);
        
        pdf.text('Voltage Drop Percentage', 20, y + 16);
        pdf.text('=', 100, y + 16);
        pdf.text(voltageDropPercent, 110, y + 16);
        
        // Add status with color
        if (voltageDropStatus.includes("PASS")) {
            pdf.setTextColor(colors.pass.r, colors.pass.g, colors.pass.b);
        } else {
            pdf.setTextColor(colors.fail.r, colors.fail.g, colors.fail.b);
        }
        pdf.text('Status: ' + voltageDropStatus, 150, y + 16);
        pdf.setTextColor(0, 0, 0);
        
        // Section 4: Power Loss Analysis
        y += 40;
        y = createTableHeader(pdf, 'Power Loss Analysis', y);
        
        // Create power loss table with detailed calculations
        pdf.setFillColor(colors.tableAlt.r, colors.tableAlt.g, colors.tableAlt.b);
        pdf.rect(15, y, 180, 80, 'F');
        
        pdf.setFontSize(10);
        pdf.text('Based on power loss:', 20, y + 8);
        
        // Formula with better formatting
        pdf.text('%Ploss = ', 20, y + 16);
        pdf.text('3 × IL × IL × R × L × 100', 40, y + 16);
        pdf.text('N × P', 40, y + 24);
        
        // Draw a line for the division
        pdf.setLineWidth(0.5);
        pdf.line(40, y + 18, 130, y + 18);
        
        // Parameters for power loss calculation
        pdf.text('IL = Full Load Current', 20, y + 32);
        pdf.text('=', 100, y + 32);
        pdf.text(requiredCurrent + ' Amps', 110, y + 32);
        
        pdf.text('N = No. Runs/phase', 20, y + 40);
        pdf.text('=', 100, y + 40);
        pdf.text(document.getElementById('numberOfCircuits').value || '1', 110, y + 40);
        
        pdf.text('Resistance of the selected Cable at 90 Deg. Cel.', 20, y + 48);
        pdf.text('=', 100, y + 48);
        pdf.text(cableResistance.toFixed(3) + ' Ohm/Km', 110, y + 48);
        
        pdf.text('P = Power', 20, y + 56);
        pdf.text('=', 100, y + 56);
        // Calculate apparent power
        const apparentPower = parseFloat(supplyVoltage) * parseFloat(requiredCurrent) * 
            (construction === 'Three-Core' || parseInt(document.getElementById('numberOfCircuits').value || '1') >= 3 ? Math.sqrt(3) : 1) / 1000;
        pdf.text(apparentPower.toFixed(1) + ' kVA', 110, y + 56);
        
        pdf.text('L = Length of the Cable in Km.', 20, y + 64);
        pdf.text('=', 100, y + 64);
        pdf.text((parseFloat(cableLength) / 1000).toFixed(3) + ' Km', 110, y + 64);
        
        pdf.text('cosθ = Full Load Power Factor', 20, y + 72);
        pdf.text('=', 100, y + 72);
        pdf.text('1.00', 110, y + 72);
        
        // Results
        y += 80;
        pdf.setFillColor(colors.tableAlt.r, colors.tableAlt.g, colors.tableAlt.b);
        pdf.rect(15, y, 180, 30, 'F');
        
        pdf.text('Power Loss', 20, y + 8);
        pdf.text('=', 100, y + 8);
        pdf.text(powerLoss, 110, y + 8);
        
        pdf.text('Power Efficiency', 20, y + 16);
        pdf.text('=', 100, y + 16);
        pdf.text(powerEfficiency, 110, y + 16);
        
        // Section 5: Short Circuit Criteria
        y += 40;
        y = createTableHeader(pdf, 'Based on short circuit criteria', y);
        
        // Create short circuit table with detailed calculations
        pdf.setFillColor(colors.tableAlt.r, colors.tableAlt.g, colors.tableAlt.b);
        pdf.rect(15, y, 180, 80, 'F');
        
        pdf.setFontSize(10);
        pdf.text('Short circuit current (3Phase)', 20, y + 8);
        pdf.text('=', 100, y + 8);
        pdf.text(ensureString(shortCircuitCurrent), 110, y + 8);
        pdf.text('As per Short circuit calculation', 140, y + 8);
        
        pdf.text('Duration of Short ckt', 20, y + 16);
        pdf.text('=', 100, y + 16);
        pdf.text(ensureString(faultDuration) + ' sec', 110, y + 16);
        pdf.text('[Assumed Breaker max tripping time]', 140, y + 16);
        
        pdf.text('Cross section area(A) of conductor required:', 20, y + 24);
        pdf.text('where,', 140, y + 24);
        
        // Formula for short circuit calculation
        pdf.text('A = ', 20, y + 32);
        pdf.text('Isc × √t', 40, y + 32);
        pdf.text('k', 40, y + 40);
        
        // Draw a line for the division
        pdf.setLineWidth(0.5);
        pdf.line(40, y + 34, 70, y + 34);
        
        // Explanation of variables
        pdf.text('I = short circuit duration', 140, y + 32);
        pdf.text('Isc = short circuit current', 140, y + 40);
        pdf.text('k = material constant (Al=0.094 & Cu=0.143)', 140, y + 48);
        
        // Calculation
        pdf.text('A = ', 20, y + 56);
        const kValue = material === 'Copper' ? 143 : 94;
        let shortCircuitArea = 0;
        try {
            shortCircuitArea = Math.round(parseFloat(shortCircuitCurrent.replace(' kA', '')) * 1000 * Math.sqrt(parseFloat(faultDuration)) / kValue);
            if (isNaN(shortCircuitArea)) shortCircuitArea = 0;
        } catch (e) {
            console.error('Error calculating short circuit area:', e);
        }
        pdf.text(ensureString(shortCircuitArea) + ' mm²', 40, y + 56);
        
        // Inference
        pdf.text('As per the calculated short circuit current and duration', 20, y + 64);
        pdf.text(material.charAt(0) + 'L ' + size + ' sqmm', 20, y + 72);
        pdf.text('is adequate', 90, y + 72);
        
        // Results with status
        y += 90;
        pdf.setFillColor(colors.tableAlt.r, colors.tableAlt.g, colors.tableAlt.b);
        pdf.rect(15, y, 180, 30, 'F');
        
        pdf.text('Withstand Capacity', 20, y + 8);
        pdf.text('=', 100, y + 8);
        pdf.text(ensureString(shortCircuitWithstand), 110, y + 8);
        
        pdf.text('Short Circuit Verification', 20, y + 16);
        pdf.text('=', 100, y + 16);
        
        // Add status with color
        const safeStatus = ensureString(shortCircuitStatus);
        if (safeStatus.includes("PASS")) {
            pdf.setTextColor(colors.pass.r, colors.pass.g, colors.pass.b);
        } else {
            pdf.setTextColor(colors.fail.r, colors.fail.g, colors.fail.b);
        }
        pdf.text(safeStatus, 110, y + 16);
        pdf.setTextColor(0, 0, 0);
        
        // Add a new page for charts and conclusion
        pdf.addPage();
        
        // Add header to the charts page
        addPageHeader(pdf);
        
        // Optimize layout to fit on single page
        // Section 6: Voltage Drop and Power Loss Analysis in a side-by-side layout
        y = 30;
        y = createTableHeader(pdf, 'Voltage Drop & Power Loss Analysis', y);
        
        // Create a container for both charts with more height to avoid overlapping
        pdf.setFillColor(245, 245, 245); // Light gray background
        pdf.rect(15, y, 180, 100, 'F');
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(15, y, 180, 100, 'S');
        
        // Draw divider between voltage drop and power loss sections
        pdf.line(105, y, 105, y + 100);
        
        // Left side: Voltage Drop Analysis
        // Chart title and values
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(colors.header.r, colors.header.g, colors.header.b);
        pdf.text('VOLTAGE DROP ANALYSIS', 60, y + 10, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Voltage Drop:', 20, y + 20);
        pdf.text(ensureString(voltageDrop), 70, y + 20);
        
        pdf.text('Percentage:', 20, y + 28);
        pdf.text(ensureString(voltageDropPercent), 70, y + 28);
        
        pdf.text('Status:', 20, y + 36);
        const safeVdStatus = ensureString(voltageDropStatus);
        if (safeVdStatus.includes("PASS")) {
            pdf.setTextColor(colors.pass.r, colors.pass.g, colors.pass.b);
        } else {
            pdf.setTextColor(colors.fail.r, colors.fail.g, colors.fail.b);
        }
        pdf.text(safeVdStatus, 70, y + 36);
        pdf.setTextColor(0, 0, 0);
        
        // Draw voltage drop bar chart
        const vdChartX = 25;
        const vdChartY = y + 42;
        const vdChartWidth = 60;
        const vdChartHeight = 35;
        
        // Draw chart background
        pdf.setFillColor(255, 255, 255);
        pdf.rect(vdChartX, vdChartY, vdChartWidth, vdChartHeight, 'F');
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(vdChartX, vdChartY, vdChartWidth, vdChartHeight, 'S');
        
        // Draw horizontal grid lines
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.2);
        for (let i = 1; i < 5; i++) {
            const lineY = vdChartY + (i * vdChartHeight / 5);
            pdf.line(vdChartX, lineY, vdChartX + vdChartWidth, lineY);
            pdf.setFontSize(6);
            pdf.text((5 - i) + '%', vdChartX - 5, lineY + 1);
        }
        
        // Draw the voltage drop bar
        let vdPercentValue = 0;
        try {
            vdPercentValue = parseFloat(voltageDropPercent);
            if (isNaN(vdPercentValue)) vdPercentValue = 0;
        } catch (e) {
            console.error('Error parsing voltage drop percent:', e);
        }
        const barHeight = Math.min(vdPercentValue, 5) * vdChartHeight / 5;
        const barWidth = 20;
        const barX = vdChartX + 20;
        const barY = vdChartY + vdChartHeight - barHeight;
        
        // Bar with color based on value
        if (vdPercentValue <= 2.5) {
            pdf.setFillColor(colors.pass.r, colors.pass.g, colors.pass.b);
        } else if (vdPercentValue <= 5) {
            pdf.setFillColor(255, 165, 0); // Orange for warning
        } else {
            pdf.setFillColor(colors.fail.r, colors.fail.g, colors.fail.b);
        }
        
        pdf.rect(barX, barY, barWidth, barHeight, 'F');
        pdf.setDrawColor(100, 100, 100);
        pdf.rect(barX, barY, barWidth, barHeight, 'S');
        
        // Add percentage on top of bar
        pdf.setFontSize(7);
        pdf.setTextColor(0, 0, 0);
        pdf.text(ensureString(voltageDropPercent), barX + barWidth / 2, barY - 2, { align: 'center' });
        
        // Add legend
        pdf.setFontSize(6);
        pdf.text('Acceptable: ≤ 5%', vdChartX, vdChartY + vdChartHeight + 8);
        
        // Right side: Power Loss Analysis
        // Chart title and values
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(colors.header.r, colors.header.g, colors.header.b);
        pdf.text('POWER LOSS ANALYSIS', 150, y + 10, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Power Loss:', 110, y + 20);
        pdf.text(ensureString(powerLoss), 160, y + 20);
        
        pdf.text('Efficiency:', 110, y + 28);
        pdf.text(ensureString(powerEfficiency), 160, y + 28);
        
        // Draw donut chart for power efficiency
        const donutX = 150;
        const donutY = y + 60;
        const donutRadius = 20;
        const donutWidth = 6;
        
        // Draw background circle (gray)
        pdf.setFillColor(220, 220, 220);
        pdf.circle(donutX, donutY, donutRadius, 'F');
        
        // Draw inner circle (white)
        pdf.setFillColor(255, 255, 255);
        pdf.circle(donutX, donutY, donutRadius - donutWidth, 'F');
        
        // Draw efficiency arc
        let efficiencyValue = 0;
        try {
            // Remove % sign if present and parse as float
            const effStr = ensureString(powerEfficiency).replace('%', '');
            efficiencyValue = parseFloat(effStr);
            if (isNaN(efficiencyValue)) efficiencyValue = 0;
        } catch (e) {
            console.error('Error parsing efficiency value:', e);
        }
        const startAngle = -90; // Start from top
        const endAngle = startAngle + (efficiencyValue * 3.6); // 3.6 degrees per percentage point
        
        // Set color based on efficiency
        if (efficiencyValue >= 98) {
            pdf.setFillColor(colors.pass.r, colors.pass.g, colors.pass.b);
        } else if (efficiencyValue >= 95) {
            pdf.setFillColor(255, 165, 0); // Orange for warning
        } else {
            pdf.setFillColor(colors.fail.r, colors.fail.g, colors.fail.b);
        }
        
        // Draw the arc segment
        drawDonutSegment(pdf, donutX, donutY, donutRadius, donutWidth, startAngle, endAngle);
        
        // Add efficiency value in the center
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.text(ensureString(powerEfficiency), donutX, donutY + 3, { align: 'center' });
        
        // Add compact power loss formula
        pdf.setFontSize(6);
        pdf.text('P = I² × R × L × N', 110, y + 36);
        pdf.text('I = ' + ensureString(requiredCurrent) + 'A', 110, y + 42);
        
        // Handle cableResistance safely
        let resistanceText = '0.000';
        try {
            if (!isNaN(cableResistance)) {
                resistanceText = cableResistance.toFixed(3);
            }
        } catch (e) {
            console.error('Error formatting cable resistance:', e);
        }
        pdf.text('R = ' + resistanceText + 'Ω/km', 110, y + 48);
        
        // Add compact conclusion section
        y += 105; // Increased spacing to prevent overlap
        y = createTableHeader(pdf, 'Conclusion', y);
        
        // Create compact conclusion box
        pdf.setFillColor(colors.tableAlt.r, colors.tableAlt.g, colors.tableAlt.b);
        pdf.rect(15, y, 180, 30, 'F');
        pdf.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
        pdf.rect(15, y, 180, 30, 'S');
        
        // Add conclusion text with smaller font
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        pdf.text('1. Derated cable ampacity (' + ensureString(finalRating) + ') > Required current (' + ensureString(requiredCurrent) + 'A)', 20, y + 8);
        pdf.text('2. Cable size meets short circuit, voltage drop & power loss criteria', 20, y + 16);
        
        // Handle material prefix safely
        let materialPrefix = 'C';
        try {
            if (material && typeof material === 'string') {
                materialPrefix = material.charAt(0);
            }
        } catch (e) {
            console.error('Error getting material prefix:', e);
        }
        pdf.text('3. ' + materialPrefix + 'L ' + ensureString(size) + ' mm² cable is adequate for this application', 20, y + 24);
        
        // Add footer to all pages
        for (let i = 1; i <= pdf.internal.getNumberOfPages(); i++) {
            pdf.setPage(i);
            addPageFooter(pdf);
        }
        
        // Return to the last page
        pdf.setPage(pdf.internal.getNumberOfPages());
        
            
        // Helper function to draw donut chart segments
        function drawDonutSegment(pdf, centerX, centerY, innerRadius, outerRadius, startAngle, endAngle) {
            // Convert angles to radians
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            
            // Calculate points
            const points = [];
            
            // Add outer arc points
            for (let angle = startAngle; angle <= endAngle; angle += 5) {
                const rad = (angle - 90) * Math.PI / 180;
                points.push({
                    x: centerX + outerRadius * Math.cos(rad),
                    y: centerY + outerRadius * Math.sin(rad)
                });
            }
            
            // Add inner arc points in reverse
            for (let angle = endAngle; angle >= startAngle; angle -= 5) {
                const rad = (angle - 90) * Math.PI / 180;
                points.push({
                    x: centerX + innerRadius * Math.cos(rad),
                    y: centerY + innerRadius * Math.sin(rad)
                });
            }
            
            // Draw the segment
            if (points.length > 0) {
                pdf.setLineWidth(0.2);
                pdf.setDrawColor(255, 255, 255);
                
                pdf.lines(
                    points.map((p, i, arr) => {
                        if (i === 0) return [0, 0]; // First point is the starting point
                        return [p.x - arr[i-1].x, p.y - arr[i-1].y]; // Relative coordinates
                    }),
                    points[0].x, points[0].y
                );
            }
        }
        
        // We already added a compact conclusion section above
        
        // Add footer
        pdf.setFontSize(8);
        pdf.text('Generated by PowerCalc - Power Plant Engineering Solutions', 105, 290, { align: 'center' });
        
        // Save the PDF
        pdf.save('PowerCalc-Report.pdf');
        
        console.log("PDF generated successfully!");
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("An error occurred while generating the PDF: " + error.message);
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("PDF generator loaded");
    
    // Add direct event listener to the download button
    const downloadBtn = document.getElementById('downloadPdfBtn');
    if (downloadBtn) {
        console.log("Adding click event listener to download button");
        downloadBtn.addEventListener('click', function() {
            console.log("Download button clicked");
            generatePDF();
        });
    } else {
        console.error("Download button not found!");
    }
});

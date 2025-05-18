// Cable resistance values in ohm/km for different sizes
const cableResistance = {
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

// Short circuit current withstand capacity in A/mm² for 1s
const shortCircuitConstants = {
    copper: 143,
    aluminum: 94
};

// Enhanced calculation function
function calculateEnhancedRating() {
    console.log("Starting enhanced calculation...");
    
    try {
        // Check if cableData is defined
        if (typeof cableData === 'undefined') {
            console.error("cableData is undefined. Make sure cabledata.js is loaded correctly.");
            alert("Error: Cable data not loaded. Please refresh the page and try again.");
            return;
        }

        // Get all form elements first and verify they exist
        const conductorMaterialEl = document.getElementById('conductorMaterial');
        const cableConstructionEl = document.getElementById('cableConstruction');
        const voltageRatingEl = document.getElementById('voltageRating');
        const conductorSizeEl = document.getElementById('conductorSize');
        const installationTypeEl = document.getElementById('installationType');
        const temperatureEl = document.getElementById('temperature');
        const depthOfLayingEl = document.getElementById('depthOfLaying');
        const thermalResistivityEl = document.getElementById('thermalResistivity');
        const numberOfCircuitsEl = document.getElementById('numberOfCircuits');
        const cableSpacingEl = document.getElementById('cableSpacing');
        const numberOfTraysEl = document.getElementById('numberOfTrays');
        
        // Verify all required form elements exist
        if (!conductorMaterialEl || !cableConstructionEl || !voltageRatingEl || 
            !conductorSizeEl || !installationTypeEl) {
            console.error("One or more required form elements not found.");
            alert("Error: Form elements missing. Please refresh the page.");
            return;
        }
        
        // Get values from form elements
        const material = conductorMaterialEl.value;
        const construction = cableConstructionEl.value;
        const voltage = voltageRatingEl.value;
        const size = parseInt(conductorSizeEl.value);
        const installation = installationTypeEl.value;
        const temp = temperatureEl ? parseInt(temperatureEl.value) : 25;
        const depth = depthOfLayingEl ? parseInt(depthOfLayingEl.value) : 900;
        const resistivity = thermalResistivityEl ? parseFloat(thermalResistivityEl.value) : 1.5;
        const circuits = numberOfCircuitsEl ? parseInt(numberOfCircuitsEl.value) : 1;
        const spacing = cableSpacingEl ? cableSpacingEl.value : "Touching";
        const trays = numberOfTraysEl ? parseInt(numberOfTraysEl.value) : 1;
        
        // Log the values to debug
        console.log("Form values:", {
            material, construction, voltage, size, installation,
            temp, depth, resistivity, circuits, spacing, trays
        });
        
        // Get user requirements with fallbacks
        const requiredCurrentEl = document.getElementById('requiredCurrent');
        const cableLengthEl = document.getElementById('cableLength');
        const supplyVoltageEl = document.getElementById('supplyVoltage');
        const maxVoltageDropEl = document.getElementById('maxVoltageDrop');
        const shortCircuitCurrentEl = document.getElementById('shortCircuitCurrent');
        const faultDurationEl = document.getElementById('faultDuration');
        
        const requiredCurrent = requiredCurrentEl ? parseFloat(requiredCurrentEl.value) || 0 : 0;
        const cableLength = cableLengthEl ? parseFloat(cableLengthEl.value) || 100 : 100;
        const supplyVoltage = supplyVoltageEl ? parseFloat(supplyVoltageEl.value) || 0 : 0;
        const maxVoltageDrop = maxVoltageDropEl ? parseFloat(maxVoltageDropEl.value) || 5 : 5;
        const shortCircuitCurrent = shortCircuitCurrentEl ? parseFloat(shortCircuitCurrentEl.value) || 0 : 0;
        const faultDuration = faultDurationEl ? parseFloat(faultDurationEl.value) || 1 : 1;
        
        console.log("Requirement values:", {
            requiredCurrent, cableLength, supplyVoltage, maxVoltageDrop, 
            shortCircuitCurrent, faultDuration
        });
        
        // Verify we have valid cable data
        if (!cableData.conductorSizes) {
            console.error("cableData.conductorSizes is missing");
            alert("Error: Cable size data is missing or invalid.");
            return;
        }
        
        // --- 1. Get Base Current Rating ---
        console.log("Getting base current rating...");
        const cableType = material === 'copper' ? 
            (construction === 'singleCore' ? 'singleCoreCopper' : 'threeCoreCopper') :
            (construction === 'singleCore' ? 'singleCoreAluminum' : 'threeCoreAluminum');
            
        console.log("Cable type:", cableType);

        if (!cableData[cableType]) {
            console.error(`Cable type ${cableType} not found in data`);
            alert(`Error: Data for ${material} ${construction} cables not found.`);
            return;
        }

        const voltageSpecificData = cableData[cableType][voltage];

        if (!voltageSpecificData) {
            console.error(`Voltage ${voltage} not found for ${cableType}`);
            alert(`Error: Data for ${voltage} not found. Please select a different voltage.`);
            return;
        }

        let baseRatingArray;
        
        if (construction === 'singleCore') {
            let arrangement;
            if (installation === 'inAir') {
                const airArrangementEl = document.getElementById('airArrangement');
                if (!airArrangementEl) {
                    console.error("airArrangement element not found");
                    arrangement = 'trefoil'; // Default fallback
                } else {
                    arrangement = airArrangementEl.value;
                }
                
                const airArrangementKey = arrangement === 'flat' ? 'flatTouching' : arrangement;
                console.log("Air arrangement key:", airArrangementKey);
                
                if (!voltageSpecificData.inAir) {
                    console.error("inAir data not found");
                    alert("Error: Data for in-air installation not found.");
                    return;
                }
                
                baseRatingArray = voltageSpecificData.inAir[airArrangementKey];
                if (!baseRatingArray) {
                    console.error(`Arrangement ${airArrangementKey} not found for inAir`);
                    alert(`Error: Data for ${arrangement} arrangement not found.`);
                    return;
                }
            } else {
                const cableArrangementEl = document.getElementById('cableArrangement');
                if (!cableArrangementEl) {
                    console.error("cableArrangement element not found");
                    arrangement = 'trefoil'; // Default fallback
                } else {
                    arrangement = cableArrangementEl.value;
                }
                
                if (!voltageSpecificData[installation]) {
                    console.error(`Installation type ${installation} not found`);
                    alert(`Error: Data for ${installation} installation not found.`);
                    return;
                }
                
                baseRatingArray = voltageSpecificData[installation][arrangement];
                if (!baseRatingArray) {
                    console.error(`Arrangement ${arrangement} not found for ${installation}`);
                    alert(`Error: Data for ${arrangement} arrangement not found for ${installation}.`);
                    return;
                }
            }
        } else { // Three-core
            if (!voltageSpecificData[installation]) {
                console.error(`Installation type ${installation} not found for three-core`);
                alert(`Error: Data for ${installation} installation not found for three-core cables.`);
                return;
            }
            
            baseRatingArray = voltageSpecificData[installation];
            if (!Array.isArray(baseRatingArray)) {
                console.error(`Base rating array not found for ${installation}`);
                alert(`Error: Current rating data for ${installation} not found.`);
                return;
            }
        }
        
        console.log("Base rating array:", baseRatingArray);
        
        const sizesArray = construction === 'singleCore' ? 
            cableData.conductorSizes.singleCore : 
            cableData.conductorSizes.threeCore;
        
        console.log("Sizes array:", sizesArray);
        
        const sizeIndex = sizesArray.indexOf(size);
        console.log("Selected size:", size, "Index:", sizeIndex);
        
        if (sizeIndex === -1) {
            console.error(`Size ${size} not found in ${construction} sizes`);
            alert(`Error: Cable size ${size} mm² not available for ${construction}.`);
            return;
        }
        
        const numericBaseRating = baseRatingArray[sizeIndex];
        console.log("Base current rating:", numericBaseRating);
        
        if (typeof numericBaseRating !== 'number') {
            console.error(`Base rating for size ${size} (index ${sizeIndex}) is not a number:`, numericBaseRating);
            alert(`Error: Current rating not available for ${size} mm².`);
            return;
        }

        // --- 2. Calculate derating factors ---
        // Temperature factor
        let tempFactor = 1.0;
        try {
            const tempDataSource = installation === 'inAir' ? 
                cableData.temperatureFactors.air : 
                installation === 'inDucts' ? 
                    cableData.temperatureFactors.ducts : 
                    cableData.temperatureFactors.ground;
                    
            if (tempDataSource && tempDataSource.temperatures && tempDataSource.factors) {
                const tempIndex = tempDataSource.temperatures.indexOf(temp);
                if (tempIndex !== -1) {
                    tempFactor = tempDataSource.factors[tempIndex];
                } else {
                    // Find closest temperature
                    let closest = 0;
                    let minDiff = 100;
                    for (let i = 0; i < tempDataSource.temperatures.length; i++) {
                        const diff = Math.abs(temp - tempDataSource.temperatures[i]);
                        if (diff < minDiff) {
                            minDiff = diff;
                            closest = i;
                        }
                    }
                    tempFactor = tempDataSource.factors[closest];
                    console.log(`Using closest temperature factor: ${tempFactor} (for ${tempDataSource.temperatures[closest]}°C)`);
                }
            }
        } catch (e) {
            console.error("Error calculating temperature factor:", e);
            // Use default value
        }
        
        // Depth factor (simplified)
        let depthFactor = 1.0;
        if (installation !== 'inAir') {
            // Simplified depth factor calculation
            if (depth > 1200) {
                depthFactor = 0.95;
            } else if (depth > 2000) {
                depthFactor = 0.9;
            }
        }
        
        // Resistivity factor (simplified)
        let resistivityFactor = 1.0;
        if (installation !== 'inAir' && resistivity !== 1.5) {
            if (resistivity > 1.5) {
                resistivityFactor = 1.5 / resistivity;
            } else {
                resistivityFactor = 1.0 + ((1.5 - resistivity) / 5);
            }
            // Keep it in reasonable range
            resistivityFactor = Math.max(0.7, Math.min(resistivityFactor, 1.2));
        }
        
        // Grouping factor (simplified)
        let groupingFactor = 1.0;
        if (circuits > 1) {
            // Simple grouping factor estimation
            if (circuits === 2) {
                groupingFactor = 0.9;
            } else if (circuits <= 4) {
                groupingFactor = 0.8;
            } else if (circuits <= 6) {
                groupingFactor = 0.75;
            } else {
                groupingFactor = 0.7;
            }
        }
        
        console.log("Derating factors:", {
            tempFactor,
            depthFactor,
            resistivityFactor,
            groupingFactor
        });
        
        // Calculate total derating factor and final rating
        const totalFactor = tempFactor * depthFactor * resistivityFactor * groupingFactor;
        const roundedTotalFactor = Math.round(totalFactor * 1000) / 1000;
        const finalRating = Math.round(numericBaseRating * totalFactor);
        
        // Calculate total current carrying capacity across all circuits
        const finalRatingTotal = finalRating * circuits;
        
        console.log("Final calculation:", {
            totalFactor: roundedTotalFactor,
            finalRatingPerCircuit: finalRating,
            finalRatingTotal,
            circuits
        });
        
        // --- Economic cable size recommendation ---
        let recommendedSize = size;
        
        if (requiredCurrent > 0) {
            // Calculate required current per circuit
            const requiredCurrentPerCircuit = requiredCurrent / circuits;
            console.log("Required current per circuit:", requiredCurrentPerCircuit);
            
            // Find the smallest cable size that can handle the required current per circuit
            for (let i = 0; i < sizesArray.length; i++) {
                const testSize = sizesArray[i];
                if (i < baseRatingArray.length) {
                    const testBaseRating = baseRatingArray[i];
                    // Apply the same derating factors
                    if (testBaseRating * totalFactor >= requiredCurrentPerCircuit) {
                        recommendedSize = testSize;
                        break;
                    }
                }
            }
        }
        
        // Safety margin calculation
        const safetyMargin = requiredCurrent > 0 ? 
            ((finalRatingTotal / requiredCurrent) - 1) * 100 : 0;
            
        console.log("Cable recommendation:", {
            recommendedSize,
            safetyMargin,
            requiredTotal: requiredCurrent,
            requiredPerCircuit: requiredCurrent / circuits
        });
        
        // --- Short circuit calculation ---
        let shortCircuitWithstand = 0;
        let shortCircuitStatus = "N/A";
        
        if (shortCircuitCurrent > 0 && size > 0) {
            // k value for the conductor material
            const kValue = shortCircuitConstants[material] || 
                (material === 'copper' ? 143 : 94);
            
            // Calculate withstand capacity
            shortCircuitWithstand = kValue * size / Math.sqrt(faultDuration);
            shortCircuitWithstand = Math.round(shortCircuitWithstand / 1000); // Convert to kA
            
            shortCircuitStatus = shortCircuitWithstand >= shortCircuitCurrent ? 
                "✓ PASS" : "✗ FAIL";
        }
        
        // --- Voltage drop calculation ---
        let voltageDrop = 0;
        let voltageDropPercent = 0;
        let voltageDropStatus = "N/A";
        
        if (supplyVoltage > 0 && size > 0 && requiredCurrent > 0) {
            // Get resistance value with fallback
            let resistancePerKm = 0;
            if (cableResistance && cableResistance[material] && cableResistance[material][size]) {
                resistancePerKm = cableResistance[material][size];
            } else {
                // Approximate resistance based on material and size
                const resistivityValue = material === 'copper' ? 1.72e-8 : 2.82e-8; // Ω·m
                resistancePerKm = resistivityValue * 1000 / (size * 1e-6); // Convert to Ω/km
            }
            
            const resistanceTotal = resistancePerKm * cableLength / 1000; // Convert to ohms
            // Use current per circuit for voltage drop calculation
            const currentPerCircuit = requiredCurrent / circuits;
            voltageDrop = currentPerCircuit * resistanceTotal;
            
            // For three phase
            if (construction === 'threeCore' || (construction === 'singleCore' && circuits >= 3)) {
                voltageDrop = Math.sqrt(3) * voltageDrop;
            }
            
            voltageDropPercent = (voltageDrop / supplyVoltage) * 100;
            
            voltageDropStatus = voltageDropPercent <= maxVoltageDrop ? 
                "✓ PASS" : "✗ FAIL";
        }
        
        // --- Power loss calculation ---
        let powerLoss = 0;
        let powerEfficiency = 0;
        
        if (requiredCurrent > 0 && size > 0) {
            // Use the same resistance value from voltage drop calculation
            let resistancePerKm = 0;
            if (cableResistance && cableResistance[material] && cableResistance[material][size]) {
                resistancePerKm = cableResistance[material][size];
            } else {
                const resistivityValue = material === 'copper' ? 1.72e-8 : 2.82e-8;
                resistancePerKm = resistivityValue * 1000 / (size * 1e-6);
            }
            
            const resistanceTotal = resistancePerKm * cableLength / 1000;
            // Calculate power loss per circuit
            const currentPerCircuit = requiredCurrent / circuits;
            let powerLossPerCircuit = 0;
            
            if (construction === 'threeCore' || (construction === 'singleCore' && circuits >= 3)) {
                // Three-phase power loss per circuit
                powerLossPerCircuit = 3 * Math.pow(currentPerCircuit, 2) * resistanceTotal;
            } else {
                // Single-phase power loss per circuit
                powerLossPerCircuit = Math.pow(currentPerCircuit, 2) * resistanceTotal;
            }
            
            // Total power loss across all circuits
            powerLoss = powerLossPerCircuit * circuits;
            
            // Calculate efficiency
            const apparentPower = supplyVoltage * requiredCurrent * 
                (construction === 'threeCore' || (construction === 'singleCore' && circuits >= 3) ? Math.sqrt(3) : 1) / 1000; // kVA
            
            powerEfficiency = apparentPower > 0 ? 100 - (powerLoss / (apparentPower * 10)) : 0;
        }
        
        // Call the displayEnhancedResults function with all calculated values
        displayEnhancedResults(
            numericBaseRating,
            finalRating,
            tempFactor,
            depthFactor,
            resistivityFactor,
            groupingFactor,
            totalFactor,
            material,
            construction,
            voltage,
            size,
            installation,
            recommendedSize,
            safetyMargin,
            shortCircuitCurrent,
            shortCircuitWithstand,
            shortCircuitStatus,
            voltageDrop,
            voltageDropPercent,
            voltageDropStatus,
            powerLoss,
            powerEfficiency,
            finalRatingTotal,
            circuits
        );
        
        console.log("Calculation completed successfully!");
        
    } catch (error) {
        console.error("Error in calculation:", error);
        alert("An error occurred during calculation: " + error.message);
    }
}

// Extended display function for enhanced results
function displayEnhancedResults(
    baseRating, 
    finalRating, 
    tempFactor, 
    depthFactor, 
    resistivityFactor, 
    groupingFactor, 
    totalFactor,
    material,
    construction,
    voltage,
    size,
    installation,
    recommendedSize,
    safetyMargin,
    shortCircuitCurrent,
    shortCircuitWithstand,
    shortCircuitStatus,
    voltageDrop,
    voltageDropPercent,
    voltageDropStatus,
    powerLoss,
    powerEfficiency,
    finalRatingTotal,
    circuits
) {
    try {
        // Results section - make it visible
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
        }
        
        // Base rating description
        const baseRatingDesc = document.getElementById('baseRatingDesc');
        const baseRatingValue = document.getElementById('baseRatingValue');
        
        if (baseRatingDesc) {
            baseRatingDesc.textContent = `${material === 'copper' ? 'Copper' : 'Aluminum'} ${construction === 'singleCore' ? 'Single-Core' : 'Three-Core'}, ${voltage}, ${size} mm²`;
        }
        
        if (baseRatingValue) {
            baseRatingValue.textContent = `${baseRating} A`;
        }
        
        // Derating factors
        const temperatureFactorValue = document.getElementById('temperatureFactorValue');
        if (temperatureFactorValue) {
            temperatureFactorValue.textContent = tempFactor.toFixed(2);
        }
        
        const depthFactorRow = document.getElementById('depthFactorRow');
        const resistivityFactorRow = document.getElementById('resistivityFactorRow');
        const depthFactorValue = document.getElementById('depthFactorValue');
        const resistivityFactorValue = document.getElementById('resistivityFactorValue');
        
        if (installation !== 'inAir') {
            if (depthFactorRow) depthFactorRow.classList.remove('hidden');
            if (resistivityFactorRow) resistivityFactorRow.classList.remove('hidden');
            if (depthFactorValue) depthFactorValue.textContent = depthFactor.toFixed(2);
            if (resistivityFactorValue) resistivityFactorValue.textContent = resistivityFactor.toFixed(2);
        } else {
            if (depthFactorRow) depthFactorRow.classList.add('hidden');
            if (resistivityFactorRow) resistivityFactorRow.classList.add('hidden');
        }
        
        const groupingFactorValue = document.getElementById('groupingFactorValue');
        if (groupingFactorValue) {
            groupingFactorValue.textContent = groupingFactor.toFixed(2);
        }
        
        const totalDeratingFactor = document.getElementById('totalDeratingFactor');
        if (totalDeratingFactor) {
            totalDeratingFactor.textContent = totalFactor.toFixed(3);
        }
        
        // Final rating
        const finalRatingValue = document.getElementById('finalRatingValue');
        if (finalRatingValue) {
            if (circuits > 1) {
                finalRatingValue.textContent = `${finalRating} A × ${circuits} = ${finalRatingTotal} A`;
            } else {
                finalRatingValue.textContent = `${finalRating} A`;
            }
        }
        
        // Cable recommendation
        document.getElementById('recommendedSize').textContent = `${recommendedSize} mm²`;
        document.getElementById('safetyMargin').textContent = safetyMargin > 0 ? 
            `${safetyMargin.toFixed(1)}%` : "Inadequate";
        
        // Short circuit
        document.getElementById('shortCircuitValue').textContent = `${shortCircuitCurrent} kA`;
        document.getElementById('shortCircuitWithstand').textContent = `${shortCircuitWithstand} kA`;
        document.getElementById('shortCircuitStatus').textContent = shortCircuitStatus;
        
        // Color code the status
        const shortCircuitStatusEl = document.getElementById('shortCircuitStatus');
        if (shortCircuitStatus.includes("PASS")) {
            shortCircuitStatusEl.classList.remove('text-red-600');
            shortCircuitStatusEl.classList.add('text-green-600', 'font-bold');
        } else if (shortCircuitStatus.includes("FAIL")) {
            shortCircuitStatusEl.classList.remove('text-green-600');
            shortCircuitStatusEl.classList.add('text-red-600', 'font-bold');
        } else {
            shortCircuitStatusEl.classList.remove('text-green-600', 'text-red-600', 'font-bold');
        }
        
        // Voltage drop
        document.getElementById('voltageDropValue').textContent = `${voltageDrop.toFixed(1)} V`;
        document.getElementById('voltageDropPercent').textContent = `${voltageDropPercent.toFixed(2)}%`;
        document.getElementById('voltageDropStatus').textContent = voltageDropStatus;
        
        // Color code the status
        const voltageDropStatusEl = document.getElementById('voltageDropStatus');
        if (voltageDropStatus.includes("PASS")) {
            voltageDropStatusEl.classList.remove('text-red-600');
            voltageDropStatusEl.classList.add('text-green-600', 'font-bold');
        } else if (voltageDropStatus.includes("FAIL")) {
            voltageDropStatusEl.classList.remove('text-green-600');
            voltageDropStatusEl.classList.add('text-red-600', 'font-bold');
        } else {
            voltageDropStatusEl.classList.remove('text-green-600', 'text-red-600', 'font-bold');
        }
        
        // Power loss
        document.getElementById('powerLossValue').textContent = `${powerLoss.toFixed(1)} W`;
        document.getElementById('powerEfficiency').textContent = `${powerEfficiency.toFixed(2)}%`;
        
        // Update the visualization if the function exists
        if (typeof renderCableVisualization === 'function') {
            let airMethod = '';
            let airArrangementValue = '';
            
            try {
                const airMethodEl = document.getElementById('airInstallationMethod');
                if (airMethodEl) {
                    airMethod = airMethodEl.value;
                }
                
                const airArrangementEl = document.getElementById('airArrangement');
                if (airArrangementEl) {
                    airArrangementValue = airArrangementEl.value;
                }
            } catch (e) {
                console.error("Error getting air installation details:", e);
            }
            
            const cableArrangementValue = document.getElementById('cableArrangement')?.value || 'trefoil';
            
            renderCableVisualization({
                material,
                construction,
                size,
                installation,
                arrangement: construction === 'singleCore' ? 
                    (installation === 'inAir' ? airArrangementValue : cableArrangementValue) : 
                    null,
                depth: parseInt(document.getElementById('depthOfLaying')?.value || 900),
                circuits: circuits,
                spacing: document.getElementById('cableSpacing')?.value || 'Touching',
                airMethod: airMethod,
                airArrangement: airArrangementValue,
                trays: parseInt(document.getElementById('numberOfTrays')?.value || 1)
            });
        } else {
            console.warn("renderCableVisualization function not found");
        }
    } catch (error) {
        console.error("Error in displayEnhancedResults:", error);
        alert("An error occurred during displayEnhancedResults: " + error.message);
    }
}

// PDF Download functionality
function downloadPdfReport() {
    const { jsPDF } = window.jspdf;
    
    // Create a new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add title
    pdf.setFontSize(16);
    pdf.text('Cable Current Rating Calculation Report', 105, 20, { align: 'center' });
    pdf.setFontSize(12);
    
    // Add date
    const today = new Date();
    pdf.text(`Generated on: ${today.toLocaleDateString()}`, 105, 30, { align: 'center' });
    
    // Add cable specifications
    pdf.setFontSize(14);
    pdf.text('Cable Specifications:', 20, 45);
    pdf.setFontSize(10);
    
    const material = document.getElementById('conductorMaterial').value === 'copper' ? 'Copper' : 'Aluminum';
    const construction = document.getElementById('cableConstruction').value === 'singleCore' ? 'Single-Core' : 'Three-Core';
    const size = document.getElementById('conductorSize').value;
    const voltage = document.getElementById('voltageRating').value;
    
    pdf.text(`Material: ${material}`, 30, 55);
    pdf.text(`Construction: ${construction}`, 30, 62);
    pdf.text(`Size: ${size} mm²`, 30, 69);
    pdf.text(`Voltage Rating: ${voltage}`, 30, 76);
    
    // Add installation details
    pdf.setFontSize(14);
    pdf.text('Installation Details:', 20, 90);
    pdf.setFontSize(10);
    
    const installation = document.getElementById('installationType').value;
    const installText = installation === 'buriedDirect' ? 'Buried Direct in Ground' : 
                        installation === 'inDucts' ? 'In Ducts' : 'In Air';
    
    pdf.text(`Installation Method: ${installText}`, 30, 100);
    
    if (installation === 'inAir') {
        const airMethod = document.getElementById('airInstallationMethod').value;
        const airText = airMethod === 'perforatedTrays' ? 'On Perforated Trays' :
                        airMethod === 'ladderSupports' ? 'On Ladder Supports' : 'On Vertical Trays';
        pdf.text(`Air Installation: ${airText}`, 30, 107);
    } else {
        if (construction === 'singleCore') {
            const arrangement = document.getElementById('cableArrangement').value;
            pdf.text(`Arrangement: ${arrangement === 'trefoil' ? 'Trefoil' : 'Flat Touching'}`, 30, 107);
        }
    }
    
    // Add calculation results
    pdf.setFontSize(14);
    pdf.text('Calculation Results:', 20, 125);
    pdf.setFontSize(10);
    
    const baseRating = document.getElementById('baseRatingValue').textContent;
    const finalRating = document.getElementById('finalRatingValue').textContent;
    const circuits = parseInt(document.getElementById('numberOfCircuits').value) || 1;
    
    pdf.text(`Base Current Rating: ${baseRating}`, 30, 135);
    pdf.text(`Final Current Rating: ${finalRating}`, 30, 142);
    if (circuits > 1) {
        pdf.text(`Number of Circuits: ${circuits}`, 30, 149);
    }
    
    // Add recommendation
    pdf.setFontSize(14);
    pdf.text('Cable Recommendation:', 20, 160);
    pdf.setFontSize(10);
    
    const recommendedSize = document.getElementById('recommendedSize').textContent;
    const safetyMargin = document.getElementById('safetyMargin').textContent;
    
    pdf.text(`Recommended Size: ${recommendedSize}`, 30, 170);
    pdf.text(`Safety Margin: ${safetyMargin}`, 30, 177);
    
    // Add short circuit analysis
    pdf.setFontSize(14);
    pdf.text('Short Circuit Analysis:', 20, 195);
    pdf.setFontSize(10);
    
    const shortCircuitValue = document.getElementById('shortCircuitValue').textContent;
    const shortCircuitWithstand = document.getElementById('shortCircuitWithstand').textContent;
    const shortCircuitStatus = document.getElementById('shortCircuitStatus').textContent;
    
    pdf.text(`Short Circuit Current: ${shortCircuitValue}`, 30, 205);
    pdf.text(`Maximum Withstand: ${shortCircuitWithstand}`, 30, 212);
    pdf.text(`Status: ${shortCircuitStatus}`, 30, 219);
    
    // Add voltage drop analysis
    pdf.setFontSize(14);
    pdf.text('Voltage Drop Analysis:', 20, 235);
    pdf.setFontSize(10);
    
    const voltageDropValue = document.getElementById('voltageDropValue').textContent;
    const voltageDropPercent = document.getElementById('voltageDropPercent').textContent;
    const voltageDropStatus = document.getElementById('voltageDropStatus').textContent;
    
    pdf.text(`Voltage Drop: ${voltageDropValue}`, 30, 245);
    pdf.text(`Percentage: ${voltageDropPercent}`, 30, 252);
    pdf.text(`Status: ${voltageDropStatus}`, 30, 259);
    
    // Add power loss analysis
    pdf.setFontSize(14);
    pdf.text('Power Loss Analysis:', 20, 275);
    pdf.setFontSize(10);
    
    const powerLossValue = document.getElementById('powerLossValue').textContent;
    const powerEfficiency = document.getElementById('powerEfficiency').textContent;
    
    pdf.text(`Power Loss: ${powerLossValue}`, 30, 285);
    pdf.text(`Efficiency: ${powerEfficiency}`, 30, 292);
    
    // Save the PDF
    pdf.save('cable-calculation-report.pdf');
} 
import { appTemplate } from './template.js';

const CONSTANTS = {
    PLOT: {
        X0: 90,
        XMAX: 474,
        Y0: 300,
        YMIN: 50,
        TEMP_MIN: -10,
        TEMP_MAX: 20,
        VORLAUF_MIN: 20,
        VORLAUF_MAX: 70
    },
    HEIZUNG: {
        Q_NORM: 1400,
        B_FAKTOR: 2.5,
        N_EXPONENT: 1.3,
        HEAT_CAPACITY: 4200 // spezifische Wärmekapazität von Wasser in J/(kg·K)
    },
    HYDRAULIK: {
        L_LEITUNG: 5, // Länge der Leitungsstücke in Metern
        ETA: 1e-3, // Viskosität Wasser in Pa s
        RHO: 1000, // Dichte Wasser in kg/m³
        KV: [0.055, 0.141, 0.221, 0.247, 0.28, 0.325], // Kv-Werte der Ventile je Einstellung, m³/h bei 1 bar       
        D_ROHR: 0.015, // Rohrdurchmesser in Metern
        PUMPENDRUCK: 30000 // Pumpendruck in Pascal (0.3 bar)
    },
    HT: [30, 30, 50, 30] // Heizlast der Räume in W/K
};

// Helper Functions
const calculateDruckverlustLeitung = (volumenstrom) => {
    // volumenstrom in m³/s
    const r = CONSTANTS.HYDRAULIK.D_ROHR / 2; // Radius in Metern
    const geschwindigkeit = volumenstrom / (Math.PI * Math.pow(r, 2)); // m/s
    const kinematischeViskositaet = CONSTANTS.HYDRAULIK.ETA / CONSTANTS.HYDRAULIK.RHO; // in m²/s
    const reynoldsZahl = (geschwindigkeit * CONSTANTS.HYDRAULIK.D_ROHR) / kinematischeViskositaet;
    // Using Blasius equation for turbulent flow (Re > 4000)
    const lambda = 0.3164 * Math.pow(kinematischeViskositaet / (geschwindigkeit * CONSTANTS.HYDRAULIK.D_ROHR), 0.25);
    const druckverlust = (lambda * CONSTANTS.HYDRAULIK.L_LEITUNG * CONSTANTS.HYDRAULIK.RHO * Math.pow(geschwindigkeit, 2)) / (2 * r);
    return druckverlust; // in Pascal
}

const calculateDruckverlustVentil = (volumenstrom, kv) => {
    // volumenstrom in m³/s, kv in m³/h bei 1 bar
    const volumenstrom_m3h = volumenstrom * 3600; // Convert m³/s to m³/h
    const deltaP = Math.pow(volumenstrom_m3h / kv, 2); // in bar
    return deltaP * 100000; // in Pascal
}

const calculateDruckverlust = (volumenstroeme, kvs) => {
    // volumenstroeme in m³/s
    // kvs in m³/h bei 1 bar
    const Vdot1 = volumenstroeme[0];
    const Vdot2 = volumenstroeme[1];
    const Vdot3 = volumenstroeme[2];
    const Vdot4 = volumenstroeme[3];
    const Vdot12 = volumenstroeme[0] + volumenstroeme[1];
    const Vdot34 = volumenstroeme[2] + volumenstroeme[3];
    const Vdot1234 = volumenstroeme[0] + volumenstroeme[1] + volumenstroeme[2] + volumenstroeme[3];
    
    const dpL2 = calculateDruckverlustLeitung(Vdot2);
    const dpL4 = calculateDruckverlustLeitung(Vdot4);
    const dpL12 = calculateDruckverlustLeitung(Vdot12);
    const dpL34 = calculateDruckverlustLeitung(Vdot34);
    const dpL1234 = calculateDruckverlustLeitung(Vdot1234);
    
    const dpV1 = calculateDruckverlustVentil(Vdot1, kvs[0]);
    const dpV2 = calculateDruckverlustVentil(Vdot2, kvs[1]);
    const dpV3 = calculateDruckverlustVentil(Vdot3, kvs[2]);
    const dpV4 = calculateDruckverlustVentil(Vdot4, kvs[3]);

    const dp1 = 2 * (dpL1234 + dpL12) + dpV1;
    const dp2 = 2 * (dpL1234 + dpL12 + dpL2) + dpV2;
    const dp3 = 2 * (dpL1234 + dpL34) + dpV3;
    const dp4 = 2 * (dpL1234 + dpL34 + dpL4) + dpV4;   

    return {dp1, dp2, dp3, dp4};
}

const calculateHeizkoerperLeistung = (uebertemp) => {
    const f = uebertemp / 50;
    return CONSTANTS.HEIZUNG.Q_NORM * 
           Math.pow(f, CONSTANTS.HEIZUNG.N_EXPONENT) * 
           CONSTANTS.HEIZUNG.B_FAKTOR;
};

const calculateHeizlast = (HT, raumtemp, aussentemp) => {
    return HT * (raumtemp - aussentemp);
};

const calculateHeizkoerperBetrieb = (aussentemp, volumenstroeme, vorlauftemp) => {
    // volumenstroeme array in m³/s, temperatures in °C
    const massenstroeme = volumenstroeme.map(v => v * CONSTANTS.HYDRAULIK.RHO); // kg/s
    const MIN_MASSENSTROM = 1e-6; // Minimaler Massenstrom zur Vermeidung von Division durch 0
    
    let raumtemp = new Array(4).fill(20);  // Startwerte
    let ruecklauf = new Array(4).fill(vorlauftemp);  // Startwerte
    let mitteltemp = new Array(4).fill(vorlauftemp);
    let heizkoerperLeistung = new Array(4);

    // Iteration für jeden Raum
    for (let raum = 0; raum < 4; raum++) {
        // Wenn Massenstrom praktisch 0 ist, setze Rücklauf = Raumtemperatur
        if (massenstroeme[raum] < MIN_MASSENSTROM) {
            ruecklauf[raum] = raumtemp;
            mitteltemp[raum] = (vorlauftemp + ruecklauf[raum]) / 2;
            heizkoerperLeistung[raum] = 0;
            raumtemp[raum] = calculateRaumtemp(raum, mitteltemp[raum], aussentemp);
            continue;
        }

        // Iterative Berechnung für jeden Raum
        for (let i = 0; i < 10; i++) {
            mitteltemp[raum] = (vorlauftemp + ruecklauf[raum]) / 2;
            heizkoerperLeistung[raum] = calculateHeizkoerperLeistung(mitteltemp[raum] - raumtemp[raum]);
            raumtemp[raum] = calculateRaumtemp(raum, mitteltemp[raum], aussentemp);            
            ruecklauf[raum] = vorlauftemp - heizkoerperLeistung[raum] / 
                (massenstroeme[raum] * CONSTANTS.HEIZUNG.HEAT_CAPACITY);
        }
    }
    
    return {
        raumtemp,
        ruecklauf,
        mitteltemp,
        heizkoerperLeistung
    };
};

const calculateRaumtemp = (iRaum, heizkoerperMitteltemp, aussentemp) => {
    // Bei sehr kleiner oder keiner Heizleistung wird die Raumtemperatur
    // sich der Außentemperatur annähern
    if (heizkoerperMitteltemp <= aussentemp) {
        return aussentemp;
    }

    let tMin = aussentemp;  // Minimum kann nicht unter Außentemp fallen
    let tMax = heizkoerperMitteltemp;  // Maximum ist die mittlere HK-Temp
    const epsilon = 0.01;  // Desired precision in °C
    
    // Iterate until we reach desired precision
    while (tMax - tMin > epsilon) {
        const tMid = (tMin + tMax) / 2;
        
        // Calculate heating power at current temperature
        const heizleistung = calculateHeizkoerperLeistung(heizkoerperMitteltemp - tMid);
        
        // Calculate heat loss at current temperature
        const heizlast = calculateHeizlast(CONSTANTS.HT[iRaum], tMid, aussentemp);
        
        // Adjust interval based on difference
        if (heizleistung > heizlast) {
            tMin = tMid;  // Room can get warmer
        } else {
            tMax = tMid;  // Room must get cooler
        }
    }
    
    return (tMin + tMax) / 2;
};

const calculateVorlauftemperatur = (aussentemp, maxVorlauf) => {
    let vorlauf = 20 + ((maxVorlauf - 20) * (20 - aussentemp)) / 30;
    return Math.min(Math.max(vorlauf, CONSTANTS.PLOT.VORLAUF_MIN), 
                   CONSTANTS.PLOT.VORLAUF_MAX);
};

const calculateMarkerX = (temp) => {
    const { X0, XMAX, TEMP_MIN, TEMP_MAX } = CONSTANTS.PLOT;
    return X0 + ((TEMP_MAX - temp) / (TEMP_MAX - TEMP_MIN)) * (XMAX - X0);
};

const calculateMarkerY = (vorlauf) => {
    const { Y0, YMIN, VORLAUF_MIN, VORLAUF_MAX } = CONSTANTS.PLOT;
    return Y0 - ((vorlauf - VORLAUF_MIN) / (VORLAUF_MAX - VORLAUF_MIN)) * (Y0 - YMIN);
};

// Main Components
const plotHeizkurve = () => {
    const vorlaufMax = parseFloat(document.getElementById('auslegung-vorlauf').value) || 60;
    const points = [];
    
    // Generate curve points
    for (let t = CONSTANTS.PLOT.TEMP_MAX; t >= CONSTANTS.PLOT.TEMP_MIN; t -= 1) {
        const vorlauf = calculateVorlauftemperatur(t, vorlaufMax);
        const x = CONSTANTS.PLOT.X0 + 
                 ((CONSTANTS.PLOT.TEMP_MAX - t) / 30) * 
                 (CONSTANTS.PLOT.XMAX - CONSTANTS.PLOT.X0);
                 
        if (x > CONSTANTS.PLOT.XMAX) continue;
        
        const y = CONSTANTS.PLOT.Y0 - 
                 ((vorlauf - CONSTANTS.PLOT.VORLAUF_MIN) / 
                 (CONSTANTS.PLOT.VORLAUF_MAX - CONSTANTS.PLOT.VORLAUF_MIN)) * 
                 (CONSTANTS.PLOT.Y0 - CONSTANTS.PLOT.YMIN);
                 
        points.push(`${x},${y}`);
    }

    // Update plot elements
    const polyline = document.getElementById('heizkurve-polyline');
    if (polyline) {
        polyline.setAttribute('points', points.join(' '));
    }
    
    updatePlotMarker();
};

const updatePlotMarker = () => {
    const marker = document.getElementById('heizkurve-marker');
    const label = document.getElementById('heizkurve-label');
    const aussentemp = parseFloat(document.getElementById('aussentemp').value) || 0;
    const vorlaufMax = parseFloat(document.getElementById('auslegung-vorlauf').value) || 60;

    if (!marker || !label) return;

    const vorlauf = calculateVorlauftemperatur(aussentemp, vorlaufMax);
    const x = calculateMarkerX(aussentemp);
    const y = calculateMarkerY(vorlauf);

    marker.setAttribute('cx', x);
    marker.setAttribute('cy', y);
    marker.style.display = "block";

    label.setAttribute('x', x - 70);
    label.setAttribute('y', y - 10);
    label.textContent = `VL: ${vorlauf.toFixed(1)}°C`;
    label.style.display = "block";
};

const updateTabelle = () => {
    const aussentemp = parseFloat(document.getElementById('aussentemp').value) || 0;
    const vorlaufMax = parseFloat(document.getElementById('auslegung-vorlauf').value) || 60;
    const vorlauf = calculateVorlauftemperatur(aussentemp, vorlaufMax);
    const volumenstroeme = calculateVolumenstroeme();
    const { raumtemp, ruecklauf, mitteltemp, heizkoerperLeistung } = calculateHeizkoerperBetrieb(aussentemp, volumenstroeme, vorlauf);
            
    const tabelle = document.querySelector('table');
    if (tabelle) {
        const zeilen = tabelle.querySelectorAll('tbody tr');

        // Zeile 1: Volumenstrom
        if (zeilen.length >= 1) {
            const volumenstromRow = zeilen[0];
            for (let i = 1; i <= 4; i++) {
                volumenstromRow.children[i].textContent = (volumenstroeme[i-1] * 3600 * 1000).toFixed(1) + ' l/h';
            }
        }

        // Zeile 2: Vorlauf
        if (zeilen.length >= 2) {
            const vorlaufRow = zeilen[1];
            for (let i = 1; i <= 4; i++) {
                vorlaufRow.children[i].textContent = vorlauf.toFixed(1) + ' °C';
            }
        }

        // Zeile 3: Rücklauf
        if (zeilen.length >= 3) {
            const ruecklaufRow = zeilen[2];
            for (let i = 1; i <= 4; i++) {
                ruecklaufRow.children[i].textContent = ruecklauf[i-1].toFixed(1) + ' °C';
            }
        }

        // Zeile 4: mittlere Heizkörpertemperatur
        if (zeilen.length >= 4) {
            const tempRow = zeilen[3];
            for (let i = 1; i <= 4; i++) {
                tempRow.children[i].textContent = mitteltemp[i-1].toFixed(1) + ' °C';
            }
        }

        // Zeile 5: Heizleistung
        if (zeilen.length >= 5) {
            const leistungRow = zeilen[4];
            for (let i = 1; i <= 4; i++) {
                leistungRow.children[i].textContent = heizkoerperLeistung[i-1].toFixed(0) + ' W';
            }
        }

        // Zeile 6: Transmissionswärmeverlust (HT-Werte)
        if (zeilen.length >= 6) {
            const htRow = zeilen[5];
            for (let i = 1; i <= 4; i++) {
                htRow.children[i].textContent = CONSTANTS.HT[i-1] + ' W/K';
            }
        }

        // Zeile 7: Heizlast Q = HT * (20 - AT)
        if (zeilen.length >= 7) {
            const heizlastRow = zeilen[6];
            for (let i = 1; i <= 4; i++) {
                const heizlast = CONSTANTS.HT[i-1] * (20 - aussentemp);
                heizlastRow.children[i].textContent = heizlast.toFixed(0) + ' W';
            }
        }

        // Zeile 8: Raumtemperatur
        if (zeilen.length >= 8) {
            const raumtempRow = zeilen[7];
            for (let i = 1; i <= 4; i++) {
                raumtempRow.children[i].textContent = raumtemp[i-1].toFixed(1) + ' °C';
            }
        }
    }
};

const calculateVolumenstroeme = () => {
    // Get current valve settings
    const kv1 = CONSTANTS.HYDRAULIK.KV[parseInt(document.getElementById('ogl').value) - 1];
    const kv2 = CONSTANTS.HYDRAULIK.KV[parseInt(document.getElementById('ogr').value) - 1];
    const kv3 = CONSTANTS.HYDRAULIK.KV[parseInt(document.getElementById('egl').value) - 1];
    const kv4 = CONSTANTS.HYDRAULIK.KV[parseInt(document.getElementById('egr').value) - 1];
    const kvs = [kv1, kv2, kv3, kv4];

    // Initial guess: equal flow rates
    let v = [0.1 / 3600, 0.1 / 3600, 0.1 / 3600, 0.1 / 3600]; // m³/s
    const epsilon = 1e-6;
    const maxIter = 100;
    let iter = 0;

    while (iter < maxIter) {
        const dp = calculateDruckverlust(v, kvs);
        
        // Check if we're close enough to the pump pressure
        const errors = [
            dp.dp1 - CONSTANTS.HYDRAULIK.PUMPENDRUCK,
            dp.dp2 - CONSTANTS.HYDRAULIK.PUMPENDRUCK,
            dp.dp3 - CONSTANTS.HYDRAULIK.PUMPENDRUCK,
            dp.dp4 - CONSTANTS.HYDRAULIK.PUMPENDRUCK
        ];
        
        if (Math.max(...errors.map(Math.abs)) < epsilon) {
            break;
        }

        // Calculate numerical Jacobian
        const h = 1e-6;
        const J = [];
        for (let i = 0; i < 4; i++) {
            J[i] = [];
            for (let j = 0; j < 4; j++) {
                const vPlus = [...v];
                vPlus[j] += h;
                const dpPlus = calculateDruckverlust(vPlus, kvs);
                const dpValues = [dpPlus.dp1, dpPlus.dp2, dpPlus.dp3, dpPlus.dp4];
                J[i][j] = (dpValues[i] - [dp.dp1, dp.dp2, dp.dp3, dp.dp4][i]) / h;
            }
        }

        // Solve J * dv = -F using simple Gaussian elimination
        const dv = solveLinearSystem(J, errors.map(e => -e));

        // Update with damping
        const alpha = 0.5;
        for (let i = 0; i < 4; i++) {
            v[i] += alpha * dv[i];
            if (v[i] < 0) v[i] = 0.01; // Prevent negative flow rates
        }

        iter++;
    }

    return v;
};

// Helper function for solving linear system
const solveLinearSystem = (A, b) => {
    const n = A.length;
    const x = new Array(n).fill(0);
    
    // Simple Gaussian elimination
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const factor = A[j][i] / A[i][i];
            for (let k = i; k < n; k++) {
                A[j][k] -= factor * A[i][k];
            }
            b[j] -= factor * b[i];
        }
    }
    
    // Back substitution
    for (let i = n - 1; i >= 0; i--) {
        let sum = b[i];
        for (let j = i + 1; j < n; j++) {
            sum -= A[i][j] * x[j];
        }
        x[i] = sum / A[i][i];
    }
    
    return x;
};

// Constants
const app = () => {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = appTemplate;

    setTimeout(() => {
        plotHeizkurve();
        updateTabelle();
        // Event Listener für das Up-Down Feld (Vorlauftemperatur)
        const input = document.getElementById('auslegung-vorlauf');
        if (input) {
            input.addEventListener('input', () => {
                plotHeizkurve();
                updateTabelle();
            });
        }
        // Event Listener für Außentemperatur
        const aussentempInput = document.getElementById('aussentemp');
        if (aussentempInput) {
            aussentempInput.addEventListener('input', () => {
                plotHeizkurve();
                updateTabelle();
            });
        }
        // Add event listeners for valve settings
        const valveInputs = ['ogl', 'ogr', 'egl', 'egr'];
        valveInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    updateTabelle();
                });
            }
        });
    }, 100);
};

document.addEventListener('DOMContentLoaded', app);
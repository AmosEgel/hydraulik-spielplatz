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
        N_EXPONENT: 1.3
    },
    HT: [30, 30, 50, 30] // Heizlast der Räume in W/K
};

// Helper Functions
const calculateHeizkoerperLeistung = (mittlereHeizkoerpertemp, raumtemp) => {
    const uebertemp = mittlereHeizkoerpertemp - raumtemp;
    const f = uebertemp / 50;
    return CONSTANTS.HEIZUNG.Q_NORM * 
           Math.pow(f, CONSTANTS.HEIZUNG.N_EXPONENT) * 
           CONSTANTS.HEIZUNG.B_FAKTOR;
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
    
    const tabelle = document.querySelector('table');
    if (tabelle) {
        const zeilen = tabelle.querySelectorAll('tbody tr');

        // Raumtemperatur in letzter Zeile setzen (Index 7)
        let raumtemp = [];
        if (zeilen.length >= 8) {
            const raumtempRow = zeilen[7];
            for (let i = 1; i <= 4; i++) {
                raumtempRow.children[i].textContent = '20.0 °C';
                raumtemp[i-1] = 20.0;
            }
        }
        
        // Zeile 2: Vorlauf
        if (zeilen.length >= 2) {
            const vorlaufRow = zeilen[1];
            for (let i = 1; i <= 4; i++) {
                vorlaufRow.children[i].textContent = vorlauf.toFixed(1) + ' °C';
            }
        }

        // Zeile 4: mittlere Heizkörpertemperatur
        let mittlereTemp = [];
        if (zeilen.length >= 4) {
            const tempRow = zeilen[3];
            for (let i = 1; i <= 4; i++) {
                tempRow.children[i].textContent = vorlauf.toFixed(1) + ' °C';
                mittlereTemp[i-1] = vorlauf;
            }
        }

        // Zeile 5: Heizleistung (jetzt mit Raumtemp aus Tabelle)
        if (zeilen.length >= 5) {
            const leistungRow = zeilen[4];
            for (let i = 1; i <= 4; i++) {
                const leistung = calculateHeizkoerperLeistung(mittlereTemp[i-1], raumtemp[i-1]);
                leistungRow.children[i].textContent = leistung.toFixed(0) + ' W';
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
    }
};

// Constants
const app = () => {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
        <h1>Hydraulik-Spielplatz</h1>
        <div style="display:flex; flex-direction:row; align-items:flex-start;">
            <!-- SVG und Eingabefelder -->
            <div style="position:relative; width:1200px; height:840px; margin-bottom:2em;">
                <object type="image/svg+xml" data="schematic.svg" width="1200" height="840" style="display:block;"></object>
                <!-- Raum-Labels oben rechts in jedem Raum -->
                <div style="position:absolute; left:350px; top:210px; width:120px; text-align:right; font-weight:bold; color:#333; pointer-events:none;">
                    Raum 1 HT=50W/K T=20°C
                </div>
                <div style="position:absolute; left:750px; top:210px; width:120px; text-align:right; font-weight:bold; color:#333; pointer-events:none;">
                    Raum 2 HT=50W/K T=20°C
                </div>
                <div style="position:absolute; left:350px; top:410px; width:120px; text-align:right; font-weight:bold; color:#333; pointer-events:none;">
                    Raum 3 HT=70W/K T=20°C
                </div>
                <div style="position:absolute; left:750px; top:410px; width:120px; text-align:right; font-weight:bold; color:#333; pointer-events:none;">
                    Raum 4 HT=50W/K T=20°C
                </div>
                <!-- OG links Heizkörper -->
                <div style="position:absolute; left:220px; top:270px; width:160px; height:60px; display:flex; flex-direction:column; align-items:center; justify-content:flex-start;">
                    <label for="ogl" style="font-size:0.95em;">Ventil-Voreinstellung</label>
                    <input id="ogl" type="number" min="1" max="6" step="1" value="3" style="width:60px; font-size:1.2em;">
                </div>
                <!-- OG rechts Heizkörper -->
                <div style="position:absolute; left:620px; top:270px; width:160px; height:60px; display:flex; flex-direction:column; align-items:center; justify-content:flex-start;">
                    <label for="ogr" style="font-size:0.95em;">Ventil-Voreinstellung</label>
                    <input id="ogr" type="number" min="1" max="6" step="1" value="3" style="width:60px; font-size:1.2em;">
                </div>
                <!-- EG links Heizkörper -->
                <div style="position:absolute; left:220px; top:470px; width:160px; height:60px; display:flex; flex-direction:column; align-items:center; justify-content:flex-start;">
                    <label for="egl" style="font-size:0.95em;">Ventil-Voreinstellung</label>
                    <input id="egl" type="number" min="1" max="6" step="1" value="3" style="width:60px; font-size:1.2em;">
                </div>
                <!-- EG rechts Heizkörper -->
                <div style="position:absolute; left:620px; top:470px; width:160px; height:60px; display:flex; flex-direction:column; align-items:center; justify-content:flex-start;">
                    <label for="egr" style="font-size:0.95em;">Ventil-Voreinstellung</label>
                    <input id="egr" type="number" min="1" max="6" step="1" value="3" style="width:60px; font-size:1.2em;">
                </div>
            </div>
            <!-- Heizkurven-Plot und Tabelle -->
            <div style="margin-left:40px; min-width:440px;">
                <svg id="heizkurve-plot" width="600" height="350" style="background:#fff;">
                    <!-- Rahmen (Box-Plot) -->
                    <rect x="89" y="49" width="384" height="252" fill="none" stroke="#888" stroke-width="2"/>
                    <!-- Vertikale Gridlines für x-Achse -->
                    <line x1="90" y1="50" x2="90" y2="300" stroke="#eee" stroke-width="1"/>
                    <line x1="154" y1="50" x2="154" y2="300" stroke="#eee" stroke-width="1"/>
                    <line x1="218" y1="50" x2="218" y2="300" stroke="#eee" stroke-width="1"/>
                    <line x1="282" y1="50" x2="282" y2="300" stroke="#eee" stroke-width="1"/>
                    <line x1="346" y1="50" x2="346" y2="300" stroke="#eee" stroke-width="1"/>
                    <line x1="410" y1="50" x2="410" y2="300" stroke="#eee" stroke-width="1"/>
                    <line x1="474" y1="50" x2="474" y2="300" stroke="#eee" stroke-width="1"/>
                    <!-- Horizontale Gridlines für y-Achse -->
                    <line x1="90" y1="300" x2="474" y2="300" stroke="#eee" stroke-width="1"/>
                    <line x1="90" y1="250" x2="474" y2="250" stroke="#eee" stroke-width="1"/>
                    <line x1="90" y1="200" x2="474" y2="200" stroke="#eee" stroke-width="1"/>
                    <line x1="90" y1="150" x2="474" y2="150" stroke="#eee" stroke-width="1"/>
                    <line x1="90" y1="100" x2="474" y2="100" stroke="#eee" stroke-width="1"/>
                    <line x1="90" y1="50" x2="474" y2="50" stroke="#eee" stroke-width="1"/>
                    <!-- Achsen -->
                    <line x1="90" y1="300" x2="474" y2="300" stroke="#333" stroke-width="2"/>
                    <line x1="90" y1="300" x2="90" y2="50" stroke="#333" stroke-width="2"/>
                    <!-- Achsen-Beschriftung -->
                    <text x="282" y="340" font-size="16" text-anchor="middle">Außentemperatur [°C]</text>
                    <text x="30" y="180" font-size="16" text-anchor="middle" transform="rotate(-90 30,180)">Vorlauftemperatur [°C]</text>
                    <!-- x-Achse Werte: gleichmäßig von 20 (links) bis -10 (rechts) -->
                    <text x="90" y="320" font-size="12" text-anchor="middle">20</text>
                    <text x="154" y="320" font-size="12" text-anchor="middle">15</text>
                    <text x="218" y="320" font-size="12" text-anchor="middle">10</text>
                    <text x="282" y="320" font-size="12" text-anchor="middle">5</text>
                    <text x="346" y="320" font-size="12" text-anchor="middle">0</text>
                    <text x="410" y="320" font-size="12" text-anchor="middle">-5</text>
                    <text x="474" y="320" font-size="12" text-anchor="middle">-10</text>
                    <!-- y-Achse Werte -->
                    <text x="75" y="300" font-size="12" text-anchor="end">20</text>
                    <text x="75" y="250" font-size="12" text-anchor="end">30</text>
                    <text x="75" y="200" font-size="12" text-anchor="end">40</text>
                    <text x="75" y="150" font-size="12" text-anchor="end">50</text>
                    <text x="75" y="100" font-size="12" text-anchor="end">60</text>
                    <text x="75" y="50" font-size="12" text-anchor="end">70</text>
                    <!-- Heizkurve (wird per JS gesetzt) -->
                    <polyline id="heizkurve-polyline" fill="none" stroke="#0074d9" stroke-width="3"/>
                    <!-- Markierungspunkt für Außentemperatur -->
                    <circle id="heizkurve-marker" r="6" fill="red" stroke="#b00" stroke-width="2" style="display:none"/>
                    <!-- Textlabel für Vorlauftemperatur am Marker -->
                    <text id="heizkurve-label" x="0" y="0" font-size="16" fill="#b00" stroke="#fff" stroke-width="0.5" style="display:none;"/>
                </svg>                
                <!-- VL Up-Down -->
                <div style="margin-top:1.5em;">
                    <label for="auslegung-vorlauf" style="font-size:1em;">Auslegungs-Vorlauftemperatur</label><br>
                    <input id="auslegung-vorlauf" type="number" min="20" max="70" step="1" value="60" style="width:70px; font-size:1.2em;">
                </div>
                <!-- Außentemperatur Up-Down -->
                <div style="margin-top:2em;">
                    <label for="aussentemp" style="font-size:1em;">Außentemperatur</label><br>
                    <input id="aussentemp" type="number" min="-10" max="20" step="1" value="0" style="width:70px; font-size:1.2em;">
                </div>
                <!-- Tabelle 1: Raumdaten -->
                <div style="margin-top:1em;">
                    <h3>Tabelle 1: Raumdaten</h3>
                    <table style="border-collapse:collapse; min-width:400px; text-align:center;">
                        <thead>
                            <tr>
                                <th style="border:1px solid #ccc; padding:4px 8px;"></th>
                                <th style="border:1px solid #ccc; padding:4px 8px;">Raum 1</th>
                                <th style="border:1px solid #ccc; padding:4px 8px;">Raum 2</th>
                                <th style="border:1px solid #ccc; padding:4px 8px;">Raum 3</th>
                                <th style="border:1px solid #ccc; padding:4px 8px;">Raum 4</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border:1px solid #ccc; padding:4px 8px;">Volumenstrom</td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                            </tr>
                            <tr>
                                <td style="border:1px solid #ccc; padding:4px 8px;">Vorlauf</td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                            </tr>
                            <tr>
                                <td style="border:1px solid #ccc; padding:4px 8px;">Rücklauf</td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                            </tr>
                            <tr>
                                <td style="border:1px solid #ccc; padding:4px 8px;">mittlere Heizkörpertemp.</td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                            </tr>
                            <tr>
                                <td style="border:1px solid #ccc; padding:4px 8px;">Heizleistung</td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                            </tr>
                            <tr>
                                <td style="border:1px solid #ccc; padding:4px 8px;">Transmissionswärmeverlust</td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                            </tr>
                            <tr>
                                <td style="border:1px solid #ccc; padding:4px 8px;">Heizlast bei 20°C</td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                            </tr>
                            <tr>
                                <td style="border:1px solid #ccc; padding:4px 8px;">Raumtemperatur</td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                                <td style="border:1px solid #ccc; padding:4px 8px;"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

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
    }, 100);
};

document.addEventListener('DOMContentLoaded', app);
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

    // Heizkurve plotten (linear zwischen (20,20) und (-10, y))
        function plotHeizkurve() {
        const y = parseFloat(document.getElementById('auslegung-vorlauf').value) || 60;
        // Achsen-Skalierung (20°C links, -10°C rechts, exakt bis -10)
        const x0 = 90, xMax = 474, y0 = 300, yMin = 50;
        const tMin = -10, tMax = 20;
        const vMin = 20, vMax = 70;
        // Punkte berechnen, Plot endet exakt bei x=-10 (xMax)
        let points = [];
        for (let t = tMax; t >= tMin; t -= 1) {
            // Lineare Interpolation zwischen (20,20) und (-10,y)
            let vorlauf = 20 + ((y - 20) * (20 - t)) / (20 - (-10));
            if (vorlauf < vMin) vorlauf = vMin;
            if (vorlauf > vMax) vorlauf = vMax;
            // x invertiert: tMax (20°C) -> x0, tMin (-10°C) -> xMax
            let x = x0 + ((tMax - t) / (tMax - tMin)) * (xMax - x0);
            // Plot nur bis xMax (x=-10)
            if (x > xMax) continue;
            points.push(`${x},${y0 - ((vorlauf - vMin) / (vMax - vMin)) * (y0 - yMin)}`);
        }
        // In Polyline eintragen
        const polyline = document.getElementById('heizkurve-polyline');
        if (polyline) {
            polyline.setAttribute('points', points.join(' '));
        }
        // Marker und Label für aktuelle Außentemperatur setzen (invertiert)
        const aussentempInput = document.getElementById('aussentemp');
        const marker = document.getElementById('heizkurve-marker');
        const label = document.getElementById('heizkurve-label');
        if (aussentempInput && marker && label) {
            const t = parseFloat(aussentempInput.value) || 0;
            const tClamped = Math.max(tMin, Math.min(tMax, t));
            let x = x0 + ((tMax - tClamped) / (tMax - tMin)) * (xMax - x0);
            let vorlauf = 20 + ((y - 20) * (20 - tClamped)) / (20 - (-10));
            if (vorlauf < vMin) vorlauf = vMin;
            if (vorlauf > vMax) vorlauf = vMax;
            let ySvg = y0 - ((vorlauf - vMin) / (vMax - vMin)) * (y0 - yMin);
            marker.setAttribute('cx', x);
            marker.setAttribute('cy', ySvg);
            marker.style.display = "block";
            // Label anzeigen und positionieren (leicht rechts oberhalb des Punkts)
            label.setAttribute('x', x - 70);
            label.setAttribute('y', ySvg - 10);
            label.textContent = `VL: ${vorlauf.toFixed(1)}°C`;
            label.style.display = "block";
        } else if (label) {
            label.style.display = "none";
        }
    }

        // Heizleistung nach Formel Q = Qnorm * f^n * b
    function HeizkroerperLeistung(mittlereHeizkoerpertemp, raumtemp) {
        const Qnorm = 1400;
        const b = 2.5;
        const n = 1.3;
        const uebertemp = mittlereHeizkoerpertemp - raumtemp;
        const f = uebertemp / 50;
        const Q = Qnorm * Math.pow(f, n) * b;
        return Q;
    }

    // Heizlast-Berechnung und Eintrag in Tabelle
    function updateHeizlastTabelle() {
        // HT-Werte aus der Tabelle (Zeile 4)
        const htWerte = [30, 50, 30, 30];
        // Außentemperatur aus Input
        const aussentempInput = document.getElementById('aussentemp');
        const at = aussentempInput ? parseFloat(aussentempInput.value) : 0;
    // Vorlauftemperatur am markierten Punkt der Heizkurve (abhängig von Außentemperatur)
    // Heizkurvenformel wie in plotHeizkurve
    const vorlaufInput = document.getElementById('auslegung-vorlauf');
    const yMax = vorlaufInput ? parseFloat(vorlaufInput.value) : 60;
    const t = at;
    // Heizkurve: linear zwischen (20,20) und (-10, yMax)
    let vorlauf = 20 + ((yMax - 20) * (20 - t)) / (20 - (-10));
    // Begrenzung wie im Plot
    const vMin = 20, vMax = 70;
    if (vorlauf < vMin) vorlauf = vMin;
    if (vorlauf > vMax) vorlauf = vMax;
        // Heizlast Q = HT * (20 - AT)
        const qWerte = htWerte.map(ht => Math.round(ht * (20 - at)));
        // Tabelle suchen
        const tabelle = document.querySelector('table');
        if (tabelle) {
            const zeilen = tabelle.querySelectorAll('tbody tr');
            // Zeile 2: mittlere Heizkörpertemperatur
            let mittlereTemp = [];
            if (zeilen.length >= 2) {
                const tempRow = zeilen[1];
                for (let i = 1; i <= 4; i++) {
                    tempRow.children[i].textContent = vorlauf.toFixed(1) + ' °C';
                    mittlereTemp[i-1] = vorlauf;
                }
            }
            // Zeile 3: Heizleistung
            if (zeilen.length >= 3) {
                const leistungRow = zeilen[2];
                for (let i = 1; i <= 4; i++) {
                    const leistung = HeizkroerperLeistung(mittlereTemp[i-1], 20);
                    leistungRow.children[i].textContent = isFinite(leistung) ? leistung.toFixed(0) + ' W' : '';
                }
            }
            // Zeile 5: Heizlast
            if (zeilen.length >= 5) {
                const heizlastRow = zeilen[4];
                for (let i = 1; i <= 4; i++) {
                    heizlastRow.children[i].textContent = qWerte[i-1] + ' W';
                }
            }
        }
    }

    setTimeout(() => {
        plotHeizkurve();
    updateHeizlastTabelle();
        // Event Listener für das Up-Down Feld (Vorlauftemperatur)
        const input = document.getElementById('auslegung-vorlauf');
        if (input) {
            input.addEventListener('input', () => {
                plotHeizkurve();
                updateHeizlastTabelle();
            });
        }
        // Event Listener für Außentemperatur
        const aussentempInput = document.getElementById('aussentemp');
        if (aussentempInput) {
            aussentempInput.addEventListener('input', () => {
                plotHeizkurve();
                updateHeizlastTabelle();
            });
        }
    }, 100);
};

document.addEventListener('DOMContentLoaded', app);
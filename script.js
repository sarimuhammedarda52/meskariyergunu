function openTab(evt, tabName) {
    let tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove("active");
    }
    let tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName).classList.add("active");
    if(evt) evt.currentTarget.className += " active";
}

let isSystemRunning = true; 
let totalProduction = 0;
let totalDefect = 0;
let oeeChartObj = null;

let downtimeHistory = []; 
let currentDowntime = null;
let downtimeTimerInterval = null;

function bildirDurus(sebep, tip) {
    if(!isSystemRunning) return;
    
    isSystemRunning = false;
    const startTimeMs = Date.now();
    const startTimeStr = new Date().toLocaleTimeString('tr-TR');

    currentDowntime = {
        id: "DT-" + Math.floor(Math.random() * 10000),
        station: "Montaj-1",
        type: tip,
        reason: sebep,
        startMs: startTimeMs,
        startStr: startTimeStr,
        endStr: "Devam Ediyor",
        duration: 0,
        status: "DEVAM EDİYOR"
    };

    document.getElementById('status-title').textContent = "SİSTEM DURUŞTA";
    document.getElementById('status-message').textContent = `Sebep: ${sebep}`;
    document.getElementById('status-panel').className = tip === 'Planlı' ? 'card status-warning' : 'card status-error';
    
    document.getElementById('wo-status').textContent = "DURAKLATILDI";
    document.getElementById('wo-status').style.color = tip === 'Planlı' ? '#d97706' : 'var(--danger-color)';

    addLogEntry(tip === 'Planlı' ? 'warning' : 'error', `Sistem durduruldu. Sebep: ${sebep}`);

    document.getElementById('downtime-buttons-container').style.display = 'none';
    document.getElementById('resume-container').style.display = 'block';
    
    document.getElementById('current-downtime-timer').textContent = "00:00:00";
    downtimeTimerInterval = setInterval(() => {
        let diff = Math.floor((Date.now() - currentDowntime.startMs) / 1000);
        document.getElementById('current-downtime-timer').textContent = formatSeconds(diff);
        currentDowntime.duration = diff;
        renderDowntimeTable();
    }, 1000);

    downtimeHistory.unshift(currentDowntime);
    renderDowntimeTable();
}

function uretimeDevam() {
    isSystemRunning = true;
    
    clearInterval(downtimeTimerInterval);
    const endTimeStr = new Date().toLocaleTimeString('tr-TR');
    
    if(currentDowntime) {
        currentDowntime.endStr = endTimeStr;
        currentDowntime.status = "BİTTİ";
        currentDowntime = null;
    }
    renderDowntimeTable();

    document.getElementById('status-title').textContent = "ÜRETİM AKTİF";
    document.getElementById('status-message').textContent = "İstasyon: Montaj-1 | Sistem normal olarak çalışıyor.";
    document.getElementById('status-panel').className = 'card status-ok';

    document.getElementById('wo-status').textContent = "ÜRETİMDE";
    document.getElementById('wo-status').style.color = 'var(--success-color)';

    addLogEntry('success', 'Duruş sonlandırıldı. Üretime devam ediliyor.');

    document.getElementById('downtime-buttons-container').style.display = 'grid';
    document.getElementById('resume-container').style.display = 'none';
}

function renderDowntimeTable() {
    const tbody = document.getElementById('downtime-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = "";
    
    downtimeHistory.forEach(dt => {
        const tr = document.createElement('tr');
        
        let typeColor = dt.type === "Planlı" ? "color: #d97706;" : "color: var(--danger-color);";
        let endText = dt.endStr === "Devam Ediyor" ? `<span style="color: var(--danger-color); font-weight: bold;">Devam Ediyor</span>` : dt.endStr;

        tr.innerHTML = `
            <td>${dt.id}</td>
            <td>${dt.station}</td>
            <td style="${typeColor}">${dt.type}</td>
            <td>${dt.reason}</td>
            <td>${dt.startStr}</td>
            <td>${endText}</td>
            <td>${formatSeconds(dt.duration)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function formatSeconds(secs) {
    let h = Math.floor(secs / 3600).toString().padStart(2, '0');
    let m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    let s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function addLogEntry(type, message) {
    const eventLog = document.getElementById('event-log');
    if(!eventLog) return;
    const li = document.createElement('li');
    li.className = `log-${type}`;
    li.innerHTML = `[${new Date().toLocaleTimeString('tr-TR')}] - ${message}`;
    eventLog.prepend(li);
    
    if(eventLog.children.length > 50) {
        eventLog.removeChild(eventLog.lastChild);
    }
}

setInterval(() => {
    document.getElementById('live-clock').textContent = new Date().toLocaleTimeString('tr-TR');
}, 1000);

document.addEventListener('DOMContentLoaded', () => {

    const USERS = {
        "mehmet.c": { name: "Mehmet Ceran", photo: "mehmetceran.jpg" },
        "ilker.k": { name: "İlker Kurtini", photo: "ilkerkurtini.jpg" },
        "arda.s": { name: "Muhammed Arda Sarı", photo: "muhammedardasari.jpg" },
        "emirhan.s": { name: "Emirhan Şenel", photo: "emirhansenel.jpg" },
        "mustafa.d": { name: "Mustafa Can Demir", photo: "mustafacandemir.jpg" }
    };

    const loginBtn = document.getElementById('login-button');
    loginBtn.addEventListener('click', () => {
        const user = document.getElementById('username').value.toLowerCase().trim();
        const pass = document.getElementById('password').value.trim();
        const msgObj = document.getElementById('login-message');

        if (user === "" || pass === "") {
            msgObj.textContent = "Kullanıcı adı ve şifre zorunludur.";
            return;
        }

        const expectedPass = "fotm" + user.split('.')[0]; 

        if (USERS[user] && pass === expectedPass) {
            document.getElementById('login-modal').style.display = 'none';
            document.getElementById('main-dashboard').style.display = 'block';
            document.getElementById('operator-name').textContent = USERS[user].name;
            document.getElementById('operator-photo').src = USERS[user].photo;
            
            baslatGrafik();
            baslatMesMotoru();
        } else {
            msgObj.textContent = 'Hatalı Kullanıcı Adı veya Şifre!';
        }
    });

    document.getElementById('password').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') loginBtn.click();
    });

    function baslatGrafik() {
        try {
            const ctx = document.getElementById('oeeChart').getContext('2d');
            oeeChartObj = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Kaliteli Üretim', 'Fire / Hata'],
                    datasets: [{ data: [100, 0], backgroundColor: ['hsl(142, 100%, 20%)', '#df2311'], borderWidth: 0 }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    cutout: '75%', 
                    plugins: { legend: { position: 'bottom' } } 
                }
            });
        } catch (e) { }
    }

    function guncelleKPI() {
        document.getElementById('kpi-total-production').textContent = totalProduction;
        document.getElementById('kpi-total-defect').textContent = totalDefect;
        
        let oee = totalProduction > 0 ? ((totalProduction - totalDefect) / totalProduction * 100).toFixed(1) : 0;
        document.getElementById('kpi-oee').textContent = oee + "%";

        if(oeeChartObj && totalProduction > 0) {
            oeeChartObj.data.datasets[0].data = [(totalProduction - totalDefect), totalDefect];
            oeeChartObj.update();
        }
    }

    function baslatMesMotoru() {
        setInterval(() => {
            if (!isSystemRunning) return; 
            
            totalProduction++;

            if (Math.random() > 0.95) {
                totalDefect++;
                addLogEntry('error', 'Hatalı ürün tespit edildi.');
            } else {
                if(totalProduction % 5 === 0) {
                    addLogEntry('info', 'Üretim devam ediyor.');
                }
            }

            if (Math.random() < 0.005 && isSystemRunning) {
                bildirDurus('Sensör Okuma Hatası', 'Plansız');
            }
            
            guncelleKPI();
        }, 12000); 
    }

    const videoElement = document.getElementById('webcam-video');
    const kameraSecim = document.getElementById('kamera-secim');
    const kameraBaslatBtn = document.getElementById('kamera-baslat-btn');

    async function kameralariListele() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            if(kameraSecim) {
                kameraSecim.innerHTML = ''; 
                if(videoDevices.length === 0) {
                    kameraSecim.innerHTML = '<option value="">Kamera Bulunamadi</option>';
                } else {
                    videoDevices.forEach((camera, index) => {
                        const option = document.createElement('option');
                        option.value = camera.deviceId;
                        option.text = camera.label || `Kamera ${index + 1}`;
                        kameraSecim.appendChild(option);
                    });
                }
            }
        } catch (err) { }
    }

    if(kameraBaslatBtn) {
        kameraBaslatBtn.addEventListener('click', async () => {
            kameraBaslatBtn.textContent = "BAĞLANIYOR...";
            try {
                if (window.stream) { window.stream.getTracks().forEach(track => track.stop()); }

                const seciliKameraId = kameraSecim.value;
                const constraints = seciliKameraId ? { video: { deviceId: { exact: seciliKameraId } }, audio: false } : { video: true, audio: false };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                
                window.stream = stream;
                if(videoElement) {
                    videoElement.srcObject = stream;
                    await videoElement.play();
                }
                
                kameraBaslatBtn.textContent = "AKTİF";
                kameraBaslatBtn.style.backgroundColor = "hsl(142, 100%, 20%)";
                addLogEntry('success', 'Kamera bağlantısı kuruldu.');
                
                const hedefKutusu = document.getElementById('hedef-kutusu');
                const hedefMetni = document.getElementById('hedef-metni');
                if(hedefKutusu) hedefKutusu.style.display = 'block';
                if(hedefMetni) hedefMetni.style.display = 'block';

            } catch (err) {
                kameraBaslatBtn.textContent = "KAMERAYI AÇ";
                kameraBaslatBtn.style.backgroundColor = "#df2311";
            }
        });
        kameralariListele();
    }
});
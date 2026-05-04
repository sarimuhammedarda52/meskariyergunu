import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json 
import cv2
import numpy as np
import base64
import time

try:
    from ultralytics import YOLO
    yolo_model = YOLO("yolo26s-cls.pt")
except Exception:
    yolo_model = None

app = FastAPI()
@app.get("/")
async def root():
    return {"mesaj": "FOT-M MES Sistemi Sunucusu Aktif", "durum": "OK"}
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://meskariyergunu.vercel.app"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HataModel(BaseModel):
    tip: str
    mesaj: str

class GirisModel(BaseModel):
    username: str
    password: str

OPERATOR_VERILERI = {
    "mehmet.c": {"password": "fotmmehmet", "name": "Mehmet Ceran", "photo": "mehmetceran.jpg"},
    "ilker.k": {"password": "fotmilker", "name": "Ilker Kurtini", "photo": "ilkerkurtini.jpg"},
    "arda.s": {"password": "fotmarda", "name": "Muhammed Arda Sarı", "photo": "muhammedardasari.jpg"},
    "emirhan.s": {"password": "fotmemirhan", "name": "Emirhan Şenel", "photo": "emirhansenel.jpg"},
    "mustafa.d": {"password": "fotmmustafa", "name": "Mustafa Can Demir", "photo": "mustafacandemir.jpg"},
    "kariyer.k": {"password": "1234", "name": "Kariyer", "photo": "1.png"},
}

@app.post("/api/login")
async def login(user_data: GirisModel):
    username = user_data.username
    password = user_data.password

    if username in OPERATOR_VERILERI:
        operator = OPERATOR_VERILERI[username]
        if operator["password"] == password:
            return JSONResponse(content={
                "status": "success",
                "username": username,
                "name": operator["name"],
                "photo": operator["photo"]
            }, status_code=200)
        else:
            raise HTTPException(status_code=401, detail="Hatali kullanici adi.")
    else:
        raise HTTPException(status_code=401, detail="Hatali kullanici adi.")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, json_string: str):
        for connection in self.active_connections:
            await connection.send_text(json_string)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/yapay_zeka")
async def yapay_zeka_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    son_gordugu_sinif = None
    ust_uste_gorme_sayisi = 0
    son_islem_zamani = 0
    
    try:
        while True:
            data = await websocket.receive_text()
            
            if yolo_model is None:
                continue
            
            su_an = time.time()
            if su_an - son_islem_zamani < 3.0:
                continue 

            try:
                encoded_data = data.split(',')[1]
                nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                h, w, _ = frame.shape
                crop_size = 224
                start_y = max(0, (h - crop_size) // 2)
                start_x = max(0, (w - crop_size) // 2)
                cropped_frame = frame[start_y:start_y+crop_size, start_x:start_x+crop_size]

                results = yolo_model(cropped_frame, verbose=False)

                top1_index = results[0].probs.top1
                tespit_edilen_sinif = results[0].names[top1_index]
                guven_orani = results[0].probs.top1conf.item()

                print(f"Analiz: {tespit_edilen_sinif} - Guven: {guven_orani:.2f}")

                if guven_orani >= 0.80:
                    if tespit_edilen_sinif == son_gordugu_sinif:
                        ust_uste_gorme_sayisi += 1
                    else:
                        son_gordugu_sinif = tespit_edilen_sinif
                        ust_uste_gorme_sayisi = 1
                    
                    if ust_uste_gorme_sayisi >= 2:
                        sinif_lower = tespit_edilen_sinif.lower()
                        if "hata" in sinif_lower or "fire" in sinif_lower or "hatali" in sinif_lower:
                            mesaj = f"KUSUR TESPITI: {tespit_edilen_sinif.upper()} (%{int(guven_orani*100)})"
                            await manager.broadcast(json.dumps({
                                "type": "error_event",
                                "payload": {
                                    "status_title": "HATA TESPITI",
                                    "status_message": mesaj,
                                    "log_message": mesaj
                                }
                            }))
                        else:
                            mesaj = f"URUN SAGLAM: {tespit_edilen_sinif.upper()} (%{int(guven_orani*100)})"
                            await manager.broadcast(json.dumps({
                                "type": "info_event",
                                "payload": {
                                    "status_title": "URETIM AKTIF",
                                    "status_message": "Urun hatasiz.",
                                    "log_message": mesaj
                                }
                            }))
                        
                        son_islem_zamani = time.time()
                        ust_uste_gorme_sayisi = 0
                        son_gordugu_sinif = None
                else:
                    ust_uste_gorme_sayisi = 0
                    son_gordugu_sinif = None

            except Exception:
                pass

    except WebSocketDisconnect:
        pass

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

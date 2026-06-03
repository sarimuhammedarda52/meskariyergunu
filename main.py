from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# CORS Ayarları (Ön yüzün sunucuya erişebilmesi için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GirisModel(BaseModel):
    username: str
    password: str

# Güncel Kullanıcı Veritabanı
OPERATOR_VERILERI = {
    "mehmet.c": {"password": "fotmmehmet", "name": "Mehmet Ceran", "photo": "mehmetceran.jpg"},
    "ilker.k": {"password": "fotmilker", "name": "Ilker Kurtini", "photo": "ilkerkurtini.jpg"},
    "arda.s": {"password": "fotmarda", "name": "Muhammed Arda Sarı", "photo": "muhammedardasari.jpg"},
    "emirhan.s": {"password": "fotmemirhan", "name": "Emirhan Şenel", "photo": "emirhansenel.jpg"},
    "mustafa.d": {"password": "fotmmustafa", "name": "Mustafa Can Demir", "photo": "mustafacandemir.jpg"},
    "kariyer.k": {"password": "1234", "name": "Kariyer", "photo": "1.png"},
    "serkan.m": {"password": "123456", "name": "Serkan Mutlu", "photo": "11.png"},
}

@app.get("/")
async def root():
    return {"mesaj": "FOT-M İmalat Yürütme Sistemleri Sunucusu Aktif", "durum": "OK"}

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
            raise HTTPException(status_code=401, detail="Hatali kullanici adi veya sifre.")
    else:
        raise HTTPException(status_code=401, detail="Hatali kullanici adi veya sifre.")

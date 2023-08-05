from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/ping")
async def ping():
    return {"pong"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8000)
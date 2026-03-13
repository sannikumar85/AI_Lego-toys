# 🚀 Quick Start Guide: How to Run AI Lego Detector

Follow these exact steps to start the application and test your newly trained AI model.

### 🛑 Prerequisites:
Open **3 completely separate terminal windows** inside VS-Code or Powershell. Ensure you are in the main project folder (`AI_Lego-toys`) in all three terminals.

---

### Step 1: Start the Backend Database Server
In your **1st terminal**, run:
```bash
cd backend
npm run dev
```
*(Wait until it says the server is running on port 5000 and connected to MongoDB).*

---

### Step 2: Start the Python AI Engine
In your **2nd terminal**, run:
```bash
cd ai_server
python main.py
```
*(Wait until you see the message: `✅ Loading custom YOLO model: models/toy_detector.pt`. This confirms your trained brain is successfully loaded!)*

---

### Step 3: Start the Web App Frontend
In your **3rd terminal**, run:
```bash
cd frontend
npm run dev
```
*(Wait until you see it finish loading).*

---

### 📷 How to Detect & Test
1. Once all three terminals are actively running, open your web browser.
2. Go to: **`http://localhost:5173`** (or `http://localhost:3000` depending on your Vite setup).
3. Access the file uploader on the website.
4. Upload any picture of a Lego piece.
5. Watch as the AI instantly draws colored boxes around the Legos and identifies them on your screen!

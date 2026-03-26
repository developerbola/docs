# tanishtiruv

## texnologiyalar

- Frontend: `React, TypeScript, Tailwind CSS, Lucide React, Tiptap.`
- Backend: `Node.js, Express, Socket.io.`
- Databaza: `MongoDB (Mongoose).`
- Autentifikatsiya: `JWT, BcryptJS.`

## O'rnatish

### 1. Loyihani klon qilish

```bash
git clone https://github.com/developerbola/docs.git
cd docs
```

### 2. Backendni ishga tushurish

```bash
cd server
npm install
npm run dev
```

`server` papkasida `.env` faylini yarating va quyidagi o'zgaruvchilarni qo'shing:

```env
PORT=           // port yozing
MONGODB_URI=    // mongo db ni url yozing
JWT_SECRET=     // jwt secret yozing
```

### 3. Frontendni ishga tushurish

```bash
cd ../client
npm install
npm run dev
```

`client` papkasida `.env` faylini yarating va quyidagi o'zgaruvchilarni qo'shing:

```env
VITE_API_URL=http://localhost:5001/api
```

[demo videoni ko‘rish](https://drive.google.com/file/d/1yLqUF7Tr4Ee2EMbnZIDoYCSjbIXUFphH/view?usp=drive_link)
(ovoz bor edi yozilmay qolibdi)

## loyiha folder strukturasi

```text
├── client/              # FRONTEND
│   ├── src/
│   │   ├── components/  # UI komponentlar
│   │   ├── context/     # auth'ni boshqarish
│   │   ├── pages/       # asosiy sahifalar
│   │   └── utils/       # yordamchi funksiyalar
├── server/              # BACKEND
│   ├── models/          # mongoose sxemalari
│   ├── routes/          # express API route lari
│   ├── sockets/         # socket.io eventlari
│   ├── middleware/      # auth va validatsiya (middleware)
│   └── server.js        # entry point
```

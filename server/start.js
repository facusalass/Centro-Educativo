import app from './index.js';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`API Educar para Transformar disponible en http://localhost:${PORT}`);
});

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import authRoutes from './modules/auth/auth.routes.js'
import candidateRoutes from './modules/cadidate/candidate.routes.js';
import offerRoutes from './modules/offers/offers.routes.js';
import companyRoutes from './modules/company/company.routes.js';
import catalogRoutes from './modules/catalog/catalog.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import matchingRoutes from "./modules/matching/matching.routes.js";
import gorillaRoutes from "./modules/tests/gorilla.routes.js";   // ← NEW

const app = express();

// Parsear orígenes permitidos desde variables de entorno
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

const allowedMethods = process.env.ALLOWED_METHODS 
  ? process.env.ALLOWED_METHODS.split(',').map(method => method.trim())
  : ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

const allowedHeaders = process.env.ALLOWED_HEADERS 
  ? process.env.ALLOWED_HEADERS.split(',').map(header => header.trim())
  : ['Content-Type', 'Authorization'];

// Middlewares globales
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: allowedMethods,
  allowedHeaders: allowedHeaders
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Rutas
app.use('/auth', authRoutes);
app.use('/candidate', candidateRoutes);
app.use('/offers', offerRoutes);
app.use('/company', companyRoutes);
app.use('/catalog', catalogRoutes);
app.use('/admin', adminRoutes);
app.use('/matching', matchingRoutes);
app.use('/tests', gorillaRoutes);           

export default app;
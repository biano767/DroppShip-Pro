# DropShip Pro - Backend API

Backend Node.js para processar pagamentos com Stripe na loja DropShip Pro.

## 🚀 Funcionalidades

- ✅ Criação de Payment Intents
- ✅ Confirmação de pagamentos  
- ✅ Webhooks do Stripe
- ✅ Reembolsos
- ✅ CORS configurado
- ✅ Pronto para Vercel

## 📦 Instalação Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves do Stripe

# Rodar localmente
npm run dev
```

## 🌐 Deploy na Vercel

### 1. Upload dos arquivos:
```bash
# Login na Vercel
npx vercel login

# Deploy inicial
npx vercel

# Deployments futuros
npx vercel --prod
```

### 2. Configurar variáveis na Vercel:
No painel da Vercel → Settings → Environment Variables:

```
STRIPE_SECRET_KEY=sk_test_ou_live...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://sua-loja.base44.com
NODE_ENV=production
```

### 3. Configurar webhook no Stripe:
1. Acesse https://dashboard.stripe.com/webhooks
2. Clique "Add endpoint"
3. URL: `https://seu-backend.vercel.app/webhook`
4. Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copie o signing secret para `STRIPE_WEBHOOK_SECRET`

## 📡 Endpoints da API

### GET /
Teste de saúde da API

### POST /create-payment-intent
Criar intenção de pagamento

### POST /confirm-payment
Confirmar status do pagamento

### POST /webhook
Receber eventos do Stripe

### POST /create-refund
Criar reembolso

## 🔧 Próximos Passos

1. Obtenha suas chaves do Stripe
2. Faça deploy na Vercel
3. Configure as variáveis de ambiente
4. Atualize sua loja para usar esta API
5. Configure webhooks no Stripe
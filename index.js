const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Para webhooks do Stripe (precisa ser raw)
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

// Para outras rotas (JSON)
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'DropShip Pro Backend API funcionando!',
    stripe: !!process.env.STRIPE_SECRET_KEY,
    timestamp: new Date().toISOString()
  });
});

// Rota para criar Payment Intent
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'brl', customer_info, order_info } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount é obrigatório' });
    }

    // Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_id: order_info?.order_id || 'no-order-id',
        customer_name: customer_info?.name || 'no-name',
        customer_email: customer_info?.email || 'no-email'
      }
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    console.error('Erro ao criar Payment Intent:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Rota para confirmar pagamento
app.post('/confirm-payment', async (req, res) => {
  try {
    const { payment_intent_id } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({ error: 'Payment Intent ID é obrigatório' });
    }

    // Buscar o Payment Intent
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });

  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Webhook do Stripe para eventos de pagamento
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send('Webhook Error: ' + err.message);
  }

  // Lidar com diferentes tipos de eventos
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ Pagamento bem-sucedido:', paymentIntent.id);
      
      // Aqui você pode:
      // 1. Atualizar status do pedido no seu banco de dados
      // 2. Enviar email de confirmação
      // 3. Notificar o sistema de fulfillment
      
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('❌ Pagamento falhou:', failedPayment.id);
      
      // Lidar com pagamento falhou
      break;
      
    default:
      console.log('Evento não tratado: ' + event.type);
  }

  res.json({ received: true });
});

// Rota para reembolso
app.post('/create-refund', async (req, res) => {
  try {
    const { payment_intent_id, amount, reason } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({ error: 'Payment Intent ID é obrigatório' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: payment_intent_id,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || 'requested_by_customer'
    });

    res.json({
      refund_id: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    });

  } catch (error) {
    console.error('Erro ao criar reembolso:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Iniciar servidor (apenas localmente)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('🚀 Servidor rodando na porta ' + PORT);
    console.log('🔑 Stripe configurado: ' + !!process.env.STRIPE_SECRET_KEY);
  });
}

module.exports = app;
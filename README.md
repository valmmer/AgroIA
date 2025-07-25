
# 🌾 AgroIA - Sistema Inteligente para o Pequeno Produtor Rural (Projeto de Portfólio)

> ⚠️ **Projeto em desenvolvimento** — Esta é uma aplicação experimental criada para demonstrar minhas habilidades com Node.js, integração de APIs e inteligência artificial no contexto de uma solução com impacto social.

---

## 🧠 Visão Geral

**AgroIA** é um projeto web em fase inicial, cujo objetivo é oferecer suporte inteligente a pequenos produtores rurais, especialmente na **tomada de decisão sobre plantio** e gestão agrícola.  
Atualmente, conta com um **chat inteligente com suporte a múltiplos idiomas**, e pretende futuramente integrar APIs climáticas e funcionalidades de planejamento agrícola.

---

## ✅ Funcionalidade Implementada

### 🤖 Assistente Virtual AgroIA

- Chat interativo com integração à API do OpenRouter (modelo GPT-3.5)
- Suporte a múltiplos idiomas: Português, Espanhol e Guarani
- Detecção automática de idioma com as bibliotecas `franc` e função personalizada para Guarani
- Processamento seguro com validação de entrada e tratamento de erros

---

## 📦 Tecnologias Utilizadas

| Tecnologia | Descrição |
|------------|-----------|
| **Node.js** + **Express** | Backend e roteamento |
| **Helmet** e **CORS** | Segurança e controle de acesso |
| **dotenv** | Variáveis de ambiente para armazenar a chave da API |
| **node-fetch** | Chamadas HTTP para a API da IA |
| **franc** | Detecção automática de idioma |
| **OpenRouter API** | Integração com modelos GPT (OpenAI/HuggingFace) |

---

## 📁 Estrutura Atual do Projeto

```
projeto-agro-inteligente/
├── public/
│   ├── css/
│   ├── js/
│   └── index.html
├── views/
│   ├── cadastro.html
│   ├── planejamento.html
│   └── chat.html
├── utils/
│   └── language.js
├── server.js
├── .env
└── package.json
```

---

## 🛠️ Em Desenvolvimento / Futuro

- [ ] Integração com a API do OpenWeatherMap para previsão do tempo
- [ ] Cadastro e persistência de produtores agrícolas
- [ ] Planejamento de plantio com base em clima e boas práticas
- [ ] Dashboard com visualização interativa de dados
- [ ] Autenticação de usuários (JWT)
- [ ] Responsividade total (PWA)

---

## 📌 Como Executar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/agroia.git
   cd agroia
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie o arquivo `.env` com sua chave da API:
   ```env
   OPENROUTER_API_KEY=sua_chave_aqui
   ```

4. Execute o projeto:
   ```bash
   node server.js
   ```

5. Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Status

✅ Chat com IA funcional  
⏳ Previsão do tempo e demais módulos: em desenvolvimento

---

## 📄 Licença

Este projeto está licenciado sob os termos da licença MIT.

---

## ✍️ Sobre o Autor

**Valmer Mariano**  
Desenvolvedor Full Stack  
[GitHub](https://github.com/valmmer)

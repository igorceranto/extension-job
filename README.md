# WhatsApp Scheduler

Uma extensão para o Chrome que permite agendar mensagens no WhatsApp Web.

## Funcionalidades

- Agendar mensagens para envio futuro
- Visualizar mensagens agendadas
- Notificações visuais para chats com mensagens agendadas
- Interface intuitiva e fácil de usar

## Instalação

1. Clone este repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Compile o projeto:
   ```bash
   npm run build
   ```
4. Carregue a extensão no Chrome:
   - Abra o Chrome e vá para `chrome://extensions/`
   - Ative o "Modo do desenvolvedor"
   - Clique em "Carregar sem compactação"
   - Selecione a pasta `dist` do projeto

## Desenvolvimento

Para desenvolvimento, você pode usar o modo de observação que recompila automaticamente quando há mudanças:

```bash
npm run watch
```

## Estrutura do Projeto

```
src/
  ├── components/     # Componentes da interface
  ├── services/       # Serviços e lógica de negócio
  ├── utils/          # Funções utilitárias
  └── main.js         # Ponto de entrada da aplicação
```

## Tecnologias Utilizadas

- JavaScript
- Webpack
- Babel
- Chrome Extension API

## Licença

MIT 
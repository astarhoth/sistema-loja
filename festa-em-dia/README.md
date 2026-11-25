# Festa em Dia

Sistema React para gestão de locações de festas. A demonstração vem com cadastros fictícios para explorar as telas. Use **Dados de exemplo** no menu para removê-los antes de iniciar uma operação.

## Rodar localmente

Use Node.js 22.12 ou uma versão mais recente.

```bash
npm install
npm run dev
```

Abra o endereço exibido no terminal. Para gerar a versão de produção, execute `npm run build`.

## Como funciona

- Uma locação pode começar como orçamento. As locações confirmadas e em andamento comprometem o estoque da data de saída até a de devolução, inclusive. Uma devolução em atraso mantém os itens comprometidos até que o pedido seja marcado como devolvido.
- O financeiro exibe os valores das locações e o saldo de caixa. Use **Nova saída** para registrar data, valor e motivo de uma despesa e, quando se aplicar, vinculá-la a um funcionário.
- Em **Categorias**, crie e mova níveis de subcategorias. Um filtro por categoria no **Acervo** inclui itens de todas as subcategorias desse ramo.
- Em **Empresa**, informe os dados da locadora. Na página **Contratos**, edite o modelo padrão ou adicione outros. Cada pedido usa o padrão automaticamente e permite escolher um modelo específico.
- Abra um pedido para imprimir o resumo e o contrato juntos, ou use **Enviar ao cliente** para preparar a mensagem com as condições no WhatsApp. O envio é confirmado no próprio WhatsApp.
- O acervo registra fotos, medidas, cores, descrições e quantidades. A página **Funcionários** permite cadastrar nome, contato, função, admissão e foto.
- Em **Agenda → Google Agenda**, baixe o arquivo `.ics`. Importe-o em uma agenda separada para a locadora e compartilhe essa agenda com a equipe no Google. A importação copia os eventos daquele momento. Para sincronização automática, uma versão com contas por locadora precisará autorizar a API do Google Agenda e vincular cada conta à sua agenda.
- Os dados ficam no navegador em que o sistema é usado. O módulo `src/data.js` concentra a persistência e as regras do estoque. Uma futura integração com banco deve aplicar a validação de disponibilidade e a gravação de reservas na mesma transação no servidor.

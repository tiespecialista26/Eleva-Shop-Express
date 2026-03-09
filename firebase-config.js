/*
  Copie e cole a configuração do seu projeto Firebase abaixo.
  1) Crie um projeto em https://console.firebase.google.com/
  2) Clique em "Adicionar app" -> Web
  3) Copie o objeto "firebaseConfig" e cole aqui.

  Atenção: este projeto usa Firestore sem autenticação para facilitar o teste.
  Qualquer pessoa com acesso ao site pode ler/escrever produtos.
*/

const FIREBASE_CONFIG = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID",
};

// Não edite abaixo (a menos que saiba o que está fazendo)
if (typeof firebase !== "undefined" && FIREBASE_CONFIG.apiKey !== "SUA_API_KEY") {
  firebase.initializeApp(FIREBASE_CONFIG);
  window.db = firebase.firestore();
}

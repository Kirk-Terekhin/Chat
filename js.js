submit.addEventListener('click', function(){
  func();
});

//основная функция
function func() {
  var userName = Name.value;
  var userLogin = Login.value;

  var myAvatar = document.querySelector('.my_avatar');
  myAvatar.setAttribute('src', 'http://localhost:5000/photos/'+userLogin);
  myAvatar.setAttribute('data-login', userLogin);

  var modal = document.querySelector('.modal__wrap');

  var connection = new WebSocket('ws://127.0.0.1:5000');
  connection.onmessage = function(e) {
    //пришло сообщение от сервер, надо его обработать
    swich(e);
    console.log(JSON.parse(e.data));
  };

  connection.onerror = function(у) {
      //ошибка соединения
      console.log(e);
  };
  connection.onerror = function(e) {
      //соединение было закрыто
      console.log(e);
  };
  connection.onopen = function() {
    //соединение установлено
        //отправить запрос о регистрации
        connection.send(JSON.stringify({
          op: 'reg',
          data: {
            name: userName,
            login: userLogin
          }
        }));
    };

  function swich(e) {
    var data = JSON.parse(e.data);
    var dataOp = data.op;
    var dataUser = data.user;
    var myName = document.querySelector('.my__name');

    switch (dataOp) {
      case 'token':
              clickSend(data.token);// передаю токен для отправки сообщений
              tenMessage(data.messages);//10 последних сообщений
              localStorage.setItem(userName + '_' + userLogin, JSON.stringify(data.token));// добавляю токен в локал сторэж
              data.users.forEach(function(item, i, arr) {// пользователи онлайн
                addUser(item.name ,item.login);
              });
              modal.style.display = 'none';
              myName.textContent = userLogin; //вывожу свое имя
        break;
      case 'message':
              if (dataUser.name === userName && dataUser.login === userLogin) {//если сообщение оправил я
                addMessage(data.body, dataUser.login, true);
              }else {//сообщение отправил не я
                addMessage(data.body, dataUser.login);
              }
        break;
      case 'user-enter':
              addUser(dataUser.name ,dataUser.login);// добавить пользователя в список
        break;
      case 'user-out':
              removeUser(dataUser.name ,dataUser.login);// удалить пользователя из списка
        break;
      case 'user-change-photo':
              replaceAvatar(dataUser.login);
        break;
      default:
    }
  }

  function clickSend(token) {// отправляю сообщение при клике на кнопку ОК
    messageOk.addEventListener('click', function () {
        if (connection.readyState === 3) {
           connection.onerror();
           return;
        }

        var message = messageText.value;
        connection.send(JSON.stringify({
            op: 'message',
            token: token, //уникальный идентификатор, полученный при регистрации
            data: {
              body: message //тело сообщения
            }
        }));
        messageText.value = '';
    });
  }

  function addMessage(message, login, my) {//шаблон и вывод сообщения
    if (!message.trim()) {
       return;
    }

    var chatMessageContainer = document.querySelector('.chat__body_message');
    var item = document.createElement('div');
    var src = document.querySelector('.my_avatar');

    var itemArr = [
      '<div class="avatar_container">',
        '<img src="http://localhost:5000/photos/'+login+'?'+Math.random()+'" alt="" class="avatar" data-login="',login,'">',
      '</div>',
      '<div class="message_item">',
        '<div class="item_name">',login,'</div>',
        '<div class="item_text">',message,'</div>',
      '</div>'
    ];
    item.className = 'chat__message_item';

    if (my) {
      var itemArr = [
        '<div class="message_item">',
          '<div class="item_name">',login,'</div>',
          '<div class="item_text bg-info">',message,'</div>',
        '</div>',
        '<div class="avatar_container">',
          '<img src="http://localhost:5000/photos/'+login+'?'+Math.random()+'" alt="" class="avatar" data-login="',login,'">',
        '</div>'
      ];
      item.className = 'chat__message_item text-right';
    }

    item.innerHTML = itemArr.join('');
    chatMessageContainer.appendChild(item);

    chatMessageContainer.scrollTop = chatMessageContainer.scrollHeight;
  }

  function addUser(name, login) {//шаблон и вывод пользователей
    var chatUser = document.querySelector('.chat__body_user');
    var userItemDiv = document.createElement('div');

    userItemDiv.className = 'chat__user_item h4';
    userItemDiv.setAttribute('data-user', name+'-'+login);
    userItemDiv.textContent = login;
    chatUser.appendChild(userItemDiv);
    chatUser.scrollTop = chatUser.scrollHeight;
  }

  function removeUser(name, login) {
    var userItem = document.querySelectorAll('.chat__user_item');
    for (var key in userItem) {
      if (userItem.hasOwnProperty(key)) {
        if (userItem[key].dataset.user === name+'-'+login) {
          userItem[key].parentNode.removeChild(userItem[key]);
        }
      }
    }
  }

  function ajaxAvatar(file) {//отправка аватарки на сервер
    var loadImage = document.querySelector('.load_image');
    loadImage.addEventListener('click', function () {
      var user = userName + '_' + userLogin;
      var token = JSON.parse(localStorage[user]);
      var data = new FormData();
      data.append('photo', file);
      data.append('token', token);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://127.0.0.1:5000/upload', false);
      xhr.send(data);

      if (xhr.status != 200) {
       // обработать ошибку
       console.log( xhr.status + ': ' + xhr.statusText ); // пример вывода: 404: Not Found
      } else {
       // вывести результат
       console.log('аватар загружен'); // responseText -- текст ответа.
      }
    });
  }

  function createPreview(file) {//превью аватарки перед загрузкой
    var reader = new FileReader();
    reader.addEventListener('load', function (e) {
      var imageResult = e.target.result;

      var imagePreview = document.querySelector('.image__preview');
      var modalPreview = document.querySelector('.modal__preview');

      imagePreview.setAttribute('src', imageResult);
      modalPreview.style.display = 'block';
    });
    reader.readAsDataURL(file);
  }

  function replaceAvatar(login) {// вызывается при изменении аватарки
    var img = document.querySelectorAll('img[data-login="'+login+'"]');
    for (var i = 0; i < img.length; i++) {
      img[i].setAttribute('src','http://localhost:5000/photos/'+login+'?'+Math.random());
    }
  }

  function tenMessage(message) {//вывод последних 10 сообщений
    for (var i = 0; i < message.length; i++) {
      if (message[i].user.name === userName && message[i].user.login === userLogin) {//если сообщение оправил я
        addMessage(message[i].body, message[i].user.login, true);
      }else {//сообщение отправил не я
        addMessage(message[i].body, message[i].user.login);
      }
      }
    }

  //получаем файл
  var dropZone = document.querySelector('input[type="file"]');
  dropZone.addEventListener('change',function (e) {
    e.stopPropagation();
    e.preventDefault();

    var file = e.target.files[0];//для аватара хватит и одной картинки
    ajaxAvatar(file);
    createPreview(file);
  })

  //модальное окно загрузки аватарки
  var myAvatar = document.querySelector('.my_avatar');
  var modalClose = document.querySelector('.modal_close');
  var modalAvatar = document.querySelector('.modal__avatar');
  myAvatar.addEventListener('click', function () {
    modalAvatar.style.zIndex = '10';
    modalAvatar.style.opacity = '1';
    // modalAvatar.style.top = (window.innerHeight - modalAvatar.innerHeight) / 2;
  });
  modalClose.addEventListener('click', function () {
    modalAvatar.removeAttribute('style');
  });

  function chatBodyHeight() {//резиновая высота
    var chatHeader = document.querySelectorAll('.chat__header');
    var chatBody = document.querySelectorAll('.chat__body');
    var chatFooter = document.querySelectorAll('.chat__footer');
    var bodyHeight = document.body.clientHeight;
    for (var i = 0; i < 2; i++) {
      chatBody[i].setAttribute('style', 'height:'+(bodyHeight - chatHeader[i].clientHeight - chatFooter[i].clientHeight - 30)+'px');
    }
    window.addEventListener('resize', chatBodyHeight);
  }
  chatBodyHeight();

}// close func

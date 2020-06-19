document.addEventListener('DOMContentLoaded', () => {
    // this is the start of the JSON, so we will dictate what happens on load
    // I want to check for localstoreage and react accordigly

    var username = localStorage.username;
    var socket;
    if (username) {
        socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    }
    else {
        user = '{{ username }}';
        console.log(user);
        // give a popup and get a valid username
        $('#loginModal').modal('show');
    }

    // define all the functions here
    document.querySelector('#sendPrivateMessage').onclick = () => {
        // Make a message to be sent to remote users
        console.log("In Send Private message");
        let messagetext= document.querySelector('#private-message-text');
        let channel= localStorage.getItem("remoteUser");
        data = {'msg': messagetext.value,'channel': channel};
        console.log(data);
        socket.emit('join-channel', channel);
        socket.emit('send-private-message', data);
        messagetext.value="";
        return false;
    };

    $('#exampleModal').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget) // Button that triggered the modal
        var recipient = button.data('whatever') // Extract info from data-* attributes
        // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
        // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
        var modal = $(this);
        modal.find('.modal-title').text('New message to ' + recipient);
        localStorage.setItem("remoteUser")=recipient;
      //  modal.find('.modal-body input').val(recipient)
    })

    document.querySelector('#create-channel-button').disabled = true;
    document.querySelector('#textbox-channel').onkeyup = () => {
        if (document.querySelector('#textbox-channel').value.length > 0)
            document.querySelector('#create-channel-button').disabled = false;
        else
            document.querySelector('#create-channel-button').disabled = true;
    };

    document.querySelector('#create_channel_form').onsubmit = () => {
        let textboxChannel= document.querySelector('#textbox-channel');
        console.log(textboxChannel.value);
        console.log(textboxChannel.id);
        socket.emit('create-channel', textboxChannel.value);
        textboxChannel.value="";
        document.querySelector('#create-channel-button').disabled = true;
        return false;
    };

    document.querySelector('#leaveChannelbutton').onclick = () => {
        console.log("Leaving channel")
        let channel= localStorage.getItem("channel");
        socket.emit('leave-channel', channel);
        localStorage.removeItem("channel");
        // Leaving a channel, so enable all others to be joined
        document.querySelectorAll('#btn-join-channel').forEach(button => {
            button.disabled = false;
        });
        let textboxChannel= document.querySelector('#textbox-channel');
        textboxChannel.disabled = false;
        document.querySelector('#communicateBox').style.visibility= "hidden";
        return false;
    };

    function code_join_button()
    {
       document.querySelectorAll('#btn-join-channel').forEach(button => {
            button.onclick = () => {
                var channel = button.dataset.channel;
                socket.emit('join-channel', channel);
            };
        });

    }

    document.querySelector('#send-message-button').onclick = () => {
        console.log("In Send message");
        let messagetext= document.querySelector('#textbox-message');
        let channel= localStorage.getItem("channel");
        data = {'msg': messagetext.value,'channel': channel};
        console.log(data);
        socket.emit('send-message', data);
        messagetext.value="";
        return false;
    };
    socket.on('message', data => {
        $('#messages').append('<tr> <td>'+data+ '</td> </tr>');
    });
    socket.on('join-accepted', channel => {
        localStorage.setItem("channel", channel);
        document.querySelector('#communicateBox').style.visibility= "visible";
        document.querySelector('#messagelist').innerHTML="";
        document.querySelector('#channelname').innerHTML="";
        $('#channelname').append('<tr> <td> <p class="text-center"><h2> <b> <i> '+channel+ ' </i></b> </h2></p></td> </tr>');
        // TODO :: Diable all other JOIN buttons
        document.querySelectorAll('#btn-join-channel').forEach(button => {
            button.disabled = true;
        });
        let textboxChannel= document.querySelector('#textbox-channel');
        textboxChannel.disabled = true;
        socket.emit('send-all-messages', channel);
    });
    socket.on('connect', () => {
        socket.emit('request-all-rooms');
        var channel = localStorage.channel;
        if (channel ){
            console.log ("Channel Exists, Joining " + channel);
            socket.emit('join-channel', channel);
        }
    });
    socket.on('connected', username => {
        localStorage.setItem("user", username);
    });
    socket.on('show-all-rooms', data => {
        $('#rooms').empty();
        for (i = 0; i < data.length; ++i) {
            toappend='<tr> <td> <div class="row">  <div class="col-lg">'+   data[i] +' </div> <div class="col-sm">  <button class="btn btn-outline-primary" id="btn-join-channel" data-channel="' + data[i] +  '">  Join   </button> </div> </div></td> </tr>';
            //console.log(toappend);
            $('#rooms').append(toappend);
        }
        code_join_button(); // time to put a little code to all the buttons just created
    });
    socket.on('receive-message', message => {
        user=message.username;
          if (user===localStorage.user) {
             toappend=' <li class="out"> ';
        }else{
            toappend=' <li class="in"> ';
        }
         toappend=toappend+' <div class="chat-body"> 	<div class="chat-message text-dark"> 	<h5> <a data-toggle="modal" href="#exampleModal"  data-whatever="'+user+'">' + user +'</a>  <small> ' +message.mtime+  ' </small>  </h5> 	<p> '+ message.msg+ '</p> </div> </div>	</li> ';
         $('#messagelist').append(toappend);
     });
});

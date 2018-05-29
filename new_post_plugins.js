
module.exports = {
    my_posts_callback: function (channelid,post) {
        //console.log("post:"+post.decrypted_message);
    },
    my_msgs_callback: function (msg) {
        console.log(JSON.stringify(msg));

        if (process.platform !== 'win32') 
        {
            
            var notif = new window.Notification("Oficloud Message", {
            body: msg.decrypted_header,
            icon: balloon_image,
            silent: false // We'll play our own sound
            });
        }
        else
        {
            appIcon.displayBalloon({
                        icon: imageFolder + '/64x64.png',
                        title:"Oficloud Message",
                        content: msg.decrypted_header
                        }); 
        }
    },
  };

  

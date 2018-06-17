'use strict';

require('./server')()
    .then((server) => {

        server.listen(3000)
            .then(() => {

                server.log([], `server running`);
            })
            .catch((err) => {

                console.error(err);
            });
    });

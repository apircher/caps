define(['durandal/app', 'authentication', '../datacontext', 'Q', '../viewmodels/deleteUserConfirmationDialog'
], function (app, authentication, datacontext, Q, DeleteUserConfirmationDialog) {

    function deleteUser(item) {
        var deferred = Q.defer();

        if (item.userName() === authentication.user().userName()) {
            app.showMessage('Du kannst Dich nicht selbst löschen. Verwende einen anderen Benutzer, um diesen Benutzer zu löschen.', 'Nicht erlaubt')
                .then(deferred.reject);
            return deferred.promise;
        }

        //dialog.showMessage('Soll ' + item.userName() + ' wirklich gelöscht werden?', 'Benutzer löschen', ['Löschen', 'Abbrechen'])
        DeleteUserConfirmationDialog.show(item.userName())
            .then(function (result) {
                if (result === 'Löschen') {
                    datacontext.deleteUser(item)
                        .then(userDeleted)
                        .fail(deleteUserFailed);
                }
            });

        function userDeleted(user) {
            app.trigger('caps:user:deleted', user);
            deferred.resolve();
        }

        function deleteUserFailed(err) {
            app.showMessage('Die Aktion konnte nicht ausgeführt werden.', 'Benutzer löschen');
            deferred.reject();
        }

        return deferred.promise;
    }

    return {
        execute: deleteUser
    };

});
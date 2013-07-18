define(['durandal/app', 'plugins/dialog', 'authentication', '../datacontext', 'Q'], function (app, dialog, authentication, datacontext, Q) {

    function deleteUser(item) {
        var deferred = Q.defer();

        if (item.userName() === authentication.user().userName()) {
            dialog.showMessage('Du kannst Dich nicht selbst löschen. Verwende einen anderen Benutzer, um diesen Benutzer zu löschen.', 'Benutzer löschen')
                .then(deferred.reject);
            return deferred.promise;
        }

        dialog.showMessage('Soll ' + item.userName() + ' wirklich gelöscht werden?', 'Benutzer löschen', ['Löschen', 'Abbrechen'])
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
            dialog.showMessage('Die Aktion konnte nicht ausgeführt werden.', 'Benutzer löschen');
            deferred.reject();
        }

        return deferred.promise;
    }

    return {
        execute: deleteUser
    };

});
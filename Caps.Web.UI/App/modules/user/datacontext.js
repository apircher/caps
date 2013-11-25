define(['Q', 'knockout', 'jquery', 'modules/user/entities'], function (Q, ko, $, model) {
    
    function getAllUsers() {
        return promiseAjax('~/api/User').then(function (data) {
            return $.map(data, function (item) { return new model.User(item); });
        });
    }

    function getAllRoles() {
        return promiseAjax('~/rpc/UserMgmt/GetAllRoles');
    }

    function getUser(userName) {
        return promiseAjax('~/api/User/' + userName).then(function (data) {
            return new model.User(data);
        });
    }

    function createUser(user) {
        return promiseAjax('~/api/User', { method: 'put', data: user.toDto() });
    }

    function updateUser(user) {
        return promiseAjax('~/api/User/' + user.userName(), { method: 'post', data: user.toDto() });
    }

    function deleteUser(user) {
        return promiseAjax('~/api/User', { method: 'delete', data: user.toDto() })
            .then(function () { return user; });
    }

    function setPassword(userName, newPassword) {
        return promiseAjax('~/rpc/UserMgmt/SetPassword', { method: 'post', data: { UserName: userName, NewPassword: newPassword } });
    }

    function promiseAjax(url, options) {
        var deferred = Q.defer();
        $.ajax(url, options).done(deferred.resolve).fail(deferred.reject);
        return deferred.promise;
    }

    return {
        getAllUsers: getAllUsers,
        getAllRoles: getAllRoles,
        getUser: getUser,
        createUser: createUser,
        updateUser: updateUser,
        deleteUser: deleteUser,
        setPassword: setPassword
    };

});
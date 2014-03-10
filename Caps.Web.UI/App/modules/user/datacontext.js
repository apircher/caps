define(['Q', 'knockout', 'jquery', 'modules/user/entities'], function (Q, ko, $, model) {
    
    function getAllUsers() {
        return promiseAjax('~/api/usermgmt/GetAllUsers').then(function (data) {
            return $.map(data, function (item) { return new model.User(item); });
        })
        .fail(function(error) {
            alert(error.message);
        });
    }

    function getAllRoles() {
        return promiseAjax('~/api/usermgmt/GetAllRoles');
    }

    function getUser(userName) {
        return promiseAjax('~/api/usermgmt/GetUser/', { method: 'get', data: { userName: userName } }).then(function (data) {
            return new model.User(data);
        });
    }

    function createUser(user) {
        return promiseAjax('~/api/usermgmt/CreateUser', { method: 'post', data: user.toDto() });
    }

    function updateUser(user) {
        return promiseAjax('~/api/usermgmt/UpdateUser', { method: 'post', data: user.toDto() });
    }

    function deleteUser(user) {
        return promiseAjax('~/api/usermgmt/DeleteUser', { method: 'post', data: user.toDto() })
            .then(function () { return user; });
    }

    function setPassword(userName, newPassword, confirmPassword) {
        return promiseAjax('~/api/usermgmt/SetPassword', { method: 'post', data: { UserName: userName, NewPassword: newPassword, ConfirmPassword: confirmPassword } });
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
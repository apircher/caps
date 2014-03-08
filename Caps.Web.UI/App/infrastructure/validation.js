/*
 * validation.js
 */
define([
    'ko',
    'knockout.validation',
    'jquery'
],
function (ko, validation, $) {
	ko.validation.rules['isUserNameUnique'] = {
		validator: function (val, param) {
			var isValid = true;

			$.ajax({
				async: false,
				url: '~/api/usermgmt/IsUsernameUnique',
				type: 'POST',
				data: { value: val, param: param },
				success: function (response) {
					isValid = response === true;
				},
				error: function () {
					isValid = false;
				}
			});

			return isValid;
		}
	};

	return {};
});
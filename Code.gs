function doGet(request) {
  var html = HtmlService.createTemplateFromFile('Index')
  html.yourEmail = Session.getActiveUser().getEmail();
  
  return html.evaluate().setTitle('Tool change User\'s email shared with Google drive account');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function executeAutoChange(emails, folderId) {
  var folder = DriveApp.getFolderById(folderId);
  emails = scanPermissionForFolder(folder, emails);
  changeForRootFolder(folder, emails);
  usersDiffPermission = scanForChildFolder(folder, emails, []);
  Logger.log(usersDiffPermission);
  if (usersDiffPermission.length > 0) {
    Logger.log('sleeping...');
    Utilities.sleep(5000);
  }
  changeForChildFolder(usersDiffPermission);
  revokePermissionRootFolder(folder, emails);
  
  return Logger.getLog();
}

function executeAddEmails(emails, folderId) {
  var folder = DriveApp.getFolderById(folderId);
  for (var i = 0; i < emails.length; i++) {
    if (emails[i].permission == DriveApp.Permission.EDIT) {
      folder.addEditor(emails[i].email); 
    } else if (emails[i].permission == DriveApp.Permission.VIEW) {
      folder.addViewer(emails[i].email); 
    }
    Logger.log('Added: ' + emails[i].email + ' - ' + emails[i].permission);
  }
  
  return Logger.getLog();
}

function executeRemoveEmails(emails, folderId) {
  var folder = DriveApp.getFolderById(folderId);
  for (var i = 0; i < emails.length; i++) {
    var permission = folder.getAccess(emails[i]);
    if (permission != DriveApp.Permission.NONE && permission != DriveApp.Permission.OWNER) {
      folder.revokePermissions(emails[i]); 
      Logger.log('Removed: ' + emails[i]);
    }
  }
  
  return Logger.getLog();
}

function changeForRootFolder(folder, emails) {
  folder.addEditor(emails[0].gsuite);
  var editorEmailsGsuite = [];
  var viewerEmailsGsuite = [];
  for (var i = 1; i < emails.length; i++) {
    if (emails[i].permission == DriveApp.Permission.EDIT) {
      editorEmailsGsuite.push(emails[i].gsuite);
    } else if (emails[i].permission == DriveApp.Permission.VIEW) {
      viewerEmailsGsuite.push(emails[i].gsuite);
    }
  }
  
  if (editorEmailsGsuite.length > 0) {
    folder.addEditors(editorEmailsGsuite);
  }
  
  if (viewerEmailsGsuite.length > 0) {
    folder.addViewers(viewerEmailsGsuite);
  }
}

function changeForChildFolder(usersDiffPermission) {
  usersDiffPermission.forEach(function (item) {
    var objectKeys = Object.keys(item);
    var folderId = objectKeys[0];
    var folder = DriveApp.getFolderById(folderId);
    item[folderId].forEach(function (user) {
      var permission = folder.getAccess(user.gsuite);
      Logger.log(folder.getName() + ' - ' + permission + user.gsuite);
      if (user.permission == DriveApp.Permission.NONE) {
        if (permission != DriveApp.Permission.NONE) {
          folder.revokePermissions(user.gsuite); 
        }
      } else if (user.permission == DriveApp.Permission.VIEW) {
        folder.revokePermissions(user.gsuite); 
        folder.addViewer(user.gsuite);
        folder.revokePermissions(user.email); 
      } else if (user.permission == DriveApp.Permission.EDIT) {
        folder.revokePermissions(user.gsuite); 
        folder.addEditor(user.gsuite); 
        folder.revokePermissions(user.email); 
      }
    });
  });
}

function revokePermissionRootFolder(folder, emails) {
    for (var i = 1; i < emails.length; i++) {
      if (emails[i].permission != DriveApp.Permission.NONE && emails[i].permission != DriveApp.Permission.OWNER) {
        folder.revokePermissions(emails[i].old); 
      }
    }
}

function scanPermissionForFolder(folder, emails) {
  var results = [];
  results[0] = emails[0];
  for (var i = 1; i < emails.length; i++) {
    var permission = folder.getAccess(emails[i].old);
    results[i] = Object.create(emails[i]);
    results[i].permission = permission;
  }
  
  return results;
}

function scanForChildFolder(folder, emails, childFoldersDiffPermission) {
  Logger.log(folder.getName());
  var usersDiffPermission = [];
  if (childFoldersDiffPermission.indexOf(folder.getName()) != -1) {
    usersDiffPermission = getUsersDiffPermissionInFolder(folder, emails);
  }
  var childFolders = folder.getFolders();
  var emailsPermissionChild = scanPermissionForFolder(folder, emails);
  var childQuery = buildQuery(emailsPermissionChild);
  childFoldersDiffPermission = getChildFoldersDiffPermission(folder, childQuery);
  while (childFolders.hasNext()) {
    var child = childFolders.next();
    usersDiffPermission = usersDiffPermission.concat(scanForChildFolder(child, emailsPermissionChild, childFoldersDiffPermission));
  }   
  
  
  return usersDiffPermission;
}

function getChildFoldersDiffPermission(folder, query) {
  var results = [];
  var childFolders= folder.searchFolders(query);
  while (childFolders.hasNext()) {
    var child = childFolders.next(); 
    results.push(child.getName());
  }
  
  return results;
}

function getUsersDiffPermissionInFolder(folder, emails) {
  var users = [];
  var folderId = folder.getId();
  var emailsPermission = [];
  for (var i = 1; i < emails.length; i++) {
    var permission = folder.getAccess(emails[i].old);
    if (permission != emails[i].permission) {
      emailsPermission.push({email:emails[i].old, permission: permission, gsuite: emails[i].gsuite});
    }
  }
  
  if (emailsPermission.length > 0) {
    var obj = {};
    obj[folderId] = emailsPermission;
    users.push(obj); 
  }
  
  return users;
}

function buildQuery(emails) {
  var query = [];
  for (var i = 1; i < emails.length; i++) {
    if (emails[i].permission == DriveApp.Permission.EDIT) {
       query.push('(not "' + emails[i].old + '" in writers)');
    } else if (emails[i].permission == DriveApp.Permission.VIEW) {
       query.push('(not "' + emails[i].old + '" in readers)');
    }
  }
  
  return '(' + query.join(' or ') + ')';
}

function changeEditors(editors, emails) {
  for (var i = 0; i < editors.length; i++) {
    var editorEmail = editors[i].getEmail();
    var user = findEmail(emails, editorEmail);
  }
}

function findEmail(items, email) {
 for (var i = 1; i < items.length; i++) {
  if (items[i].old.toLowerCase() == email.toLowerCase()) {
   return items[i];  
  }
 }
}

const signUpEmail = document.querySelector('#signUpEmail');
const signUpPw = document.querySelector('#signUpPw');
const signUpBtn = document.querySelector('#signUpBtn');

const signInEmail = document.querySelector('#signInEmail');
const signInPw = document.querySelector('#signInPw');
const signInBtn = document.querySelector('#signInBtn');

signUpBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const signUpName = document.querySelector('#signUpName');
    firebase.auth().createUserWithEmailAndPassword(signUpEmail.value, signUpPw.value)
        .then(() => {
            const user = firebase.auth().currentUser;
            user.updateProfile({
                displayName: `${signUpName.value}`,
            }).then(() => {
                console.log("暱稱設定成功");
                const data = {
                    id: user.uid,
                    name: user.displayName,
                    email: user.email,
                }
                db.collection("users").doc(`${user.email}`).set(data)
                    .then(() => console.log("使用者建檔成功!"))
                    .catch((error) => console.log("使用者建檔 failed: ", error));
            }).catch((error) => console.log("暱稱設定 failed", error));
            console.log("註冊成功");
        }).catch((error) => console.log("註冊 failed", error));
});

signInBtn.addEventListener('click', (e) => {
    e.preventDefault();
    firebase.auth().signInWithEmailAndPassword(signInEmail.value, signInPw.value)
        .then(() => console.log("登入成功"))
        .catch((error) => console.log("登入 failed", error));
});

signOutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    firebase.auth().signOut()
        .then(() => console.log("登出成功"))
        .catch((error) => console.log("登出 failed", error));
});

firebase.auth().onAuthStateChanged((user) => {
    const afterSignIn = document.querySelector('#afterSignIn');
    const postArticleWrap = document.querySelector('#postArticleWrap');
    const searchTag = document.querySelector('#searchTag');
    const searchFriendWrap = document.querySelector('#searchFriendWrap');
    if (user) {
        console.log("你有登入，可以 PO 文、加好友、搜尋");
        afterSignIn.style.display = 'flex';
        checkFriends(user);
        postNewArticle(user, postArticleWrap);
        searchUser(user, searchUserWrap);
        searchTagAll(searchTag);
        searchFriendAll(user, searchFriendWrap);
    } else {
        console.log("你沒登入，不給 PO 文、加好友、搜尋");
        afterSignIn.style.display = 'none';
    }
});

function checkFriends(user) {
    db.collection('users').doc(`${user.email}`).collection('friends').get()
        .then((friends) => {
            const accept = { status: 1 };
            const reject = { status: 0 };
            friends.forEach(f => {
                console.log(f.id, '=>', f.data());
                if(f.data().status === 2) {
                    if(confirm(f.id + " 還沒答應要當你好友，請問要取消申請嗎？")) {
                        db.collection('users').doc(`${user.email}`).collection('friends').doc(`${f.id}`).set(reject)
                            .then(() => console.log('你取消了好友申請'))
                            .catch((error) => console.log('取消失敗 failed', error));
                        db.collection('users').doc(`${f.id}`).collection('friends').doc(`${user.email}`).set(reject)
                            .catch((error) => console.log('取消瞬間發生了某些錯誤 failed', error));
                    } else {
                        console.log("你選擇繼續等他～");
                    }
                }
                if(f.data().status === 3) {
                    if (confirm(f.id + " 想跟你做朋友")) {
                        db.collection('users').doc(`${user.email}`).collection('friends').doc(`${f.id}`).set(accept)
                            .then(() => console.log('你們是好友了～!'))
                            .catch((error) => console.log('沒加成好友 failed', error));
                        db.collection('users').doc(`${f.id}`).collection('friends').doc(`${user.email}`).set(accept)
                            .catch((error) => console.log('加友瞬間發生了某些錯誤 failed', error));
                    } else {
                        db.collection('users').doc(`${user.email}`).collection('friends').doc(`${f.id}`).set(reject)
                            .then(() => console.log('你拒絕了他'))
                            .catch((error) => console.log('拒絕失敗 failed', error));
                        db.collection('users').doc(`${f.id}`).collection('friends').doc(`${user.email}`).set(reject)
                            .catch((error) => console.log('拒絕瞬間發生了某些錯誤 failed', error));
                    };
                }
            })
        })
}

function postNewArticle(user, form) {
    const postBtn = document.querySelector('#postBtn');
    const articleTag = document.querySelector('#articleTag');
    postBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const postData = new FormData(form);
        const articleTitle = postData.get('articleTitle');
        const articleContent = postData.get('articleContent');
        const postRef = db.collection("article").doc();
        const data = {
            article_id: postRef.id,
            article_title: articleTitle,
            article_content: articleContent,
            article_tag: articleTag.value,
            author: user.email,
            created_time: new Date()
        }
        postRef.set(data)
            .then(() => console.log("PO 文成功", data))
            .catch((error) => console.log(error));
    });
}

function searchUser(user, form) {
    const searchUserBtn = document.querySelector('#searchUserBtn');
    searchUserBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const searchData = new FormData(form);
        const searchUserEmail = searchData.get('searchUserEmail');
        console.log("要搜尋的人是", searchUserEmail);

        let isExists;
        db.collection('users').get()
            .then((users) => {
                users.forEach((user) => {
                    if (user.data().email === searchUserEmail) {
                        isExists = true;
                    }
                });
                if (isExists) {
                    console.log('有這個人');
                    db.collection('users').doc(`${user.email}`).collection('friends').get()
                        .then(() => {
                            // me.forEach(f => {
                            //     if(f.id === searchUserEmail && f.data().status === 1) {
                            //         console.log('你們已經是好友了');
                            //     }
                            // });
                            const send = { status: 2 };
                            const receive = { status: 3 };
                            if (confirm('你們還不是好友，請問要加好友嗎？')) {
                                db.collection('users').doc(`${user.email}`).collection('friends').doc(`${searchUserEmail}`).set(send)
                                    .then(() => console.log('申請加好友成功'))
                                    .catch((error) => console.log('申請加好友 failed', error));
                                db.collection('users').doc(`${searchUserEmail}`).collection('friends').doc(`${user.email}`).set(receive)
                                    .then(() => console.log('對方已收到你的申請'))
                                    .catch((error) => console.log('申請傳不出去 failed', error));
                            } else {
                                console.log('你按了取消');
                            }
                        })
                        .catch((error) => console.log(error));
                } else {
                    console.log('沒這個人');
                }
            }).catch((error) => console.log(error))
    })
}

function searchTagAll(form) {
    const searchTagBtn = document.querySelector('#searchTagBtn');
    searchTagBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const searchVal = form.value;
        console.log("要搜尋的 Tag 是", searchVal);

        db.collection('article').get()
            .then((articles) => {
                articles.forEach((article) => {
                    if (article.data().article_tag === searchVal) {
                        console.log(article.data());
                    }
                });
            }).catch((error) => console.log(error))
    })
}

function searchFriendAll(user, form) {
    const searchFriendBtn = document.querySelector('#searchFriendBtn');
    searchFriendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const searchData = new FormData(form);
        const searchFriend = searchData.get('searchFriend');
        const searchFriendTag = document.querySelector('#searchFriendTag');
        console.log("要搜尋的好友是", searchFriend);
        console.log("要搜尋的 Tag 是", searchFriendTag.value);
        
        db.collection('users').doc(`${user.email}`).collection('friends').get()
            .then((me) => {
                // let notFriends = false;
                    me.forEach(f => {
                        if(f.id === searchFriend && f.data().status === 1) {
                                console.log('你們是好友，可以搜尋');
                                db.collection('article').get()
                                .then((articles) => {
                                    articles.forEach((article) => {
                                        if (article.data().author === searchFriend && searchFriendTag.value === 'All') {
                                            console.log(article.data());
                                        } else if (article.data().author === searchFriend && article.data().article_tag === searchFriendTag.value) {
                                            console.log(article.data());
                                        }
                                    });
                                }).catch(error => console.log(error));
                        } // else {
                        //     notFriends = true;
                        // }
                    });
                // if (notFriends) {
                //     console.log('你們還不是朋友，不給搜');
                // }
            }).catch(error => console.log("搜尋出錯了", error));   
        })
    }
    

$('.js-open-box').on('click',function(){
    $('.overlay,.box-login').fadeIn(200);
});

$('.overlay').on('click',function(){
    $('.overlay,.box-login').fadeOut(200,function(){
        $(this).removeAttr('style');
    });
});
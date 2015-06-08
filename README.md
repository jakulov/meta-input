# Meta input

Simple light weight jQuery widget, allows you to customize html input and select tags into user friendly elements with autocomplete, multiple choose and more.
 
Demos and documentation [http://meta-input.jakulov.ru](meta-input.jakulov.ru)

# Simple usage
    
    <link rel="stylesheet" href="http://meta-input.jakulov.ru/css/meta_input.css">
    <script src="http://meta-input.jakulov.ru/js/meta_input.min.js">
    
    <input type="text" placeholder="Type to search..." id="myInput" name="myInput">
    <script>
        $(function(){
            $('#myInput').meta_input({data: ['Option 1', 'Option 2', ...]});
        });
    </script>
    
# TODO

1. minInputLength option
2. test in browsers
3. bind to elements collection
4. API

# CHANGELOG
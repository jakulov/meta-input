# Meta input

version 0.1
Simple lightweight (7Kb) jQuery widget, allows you to customize html input and select tags into user friendly elements with autocomplete, multiple choose and more.
 
Demos and documentation [meta-input.jakulov.ru](http://meta-input.jakulov.ru)

# Simple usage
    
    <link rel="stylesheet" href="http://meta-input.jakulov.ru/css/meta_input.css">
    <script src="https://code.jquery.com/jquery-2.1.4.min.js">
    <script src="http://meta-input.jakulov.ru/js/meta_input.min.js">
    
    <input type="text" placeholder="Type to search..." id="myInput" name="myInput">
    <script>
        $(function(){
            $('#myInput').meta_input({data: ['Option 1', 'Option 2', ...]});
        });
    </script>


# CHANGELOG

- v0.1 Initial state
- v0.1.1 Removed jQuery from source repository
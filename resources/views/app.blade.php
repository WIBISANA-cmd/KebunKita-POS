<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @if (config('broadcasting.default') === 'reverb')
        <meta name="reverb-key" content="{{ config('broadcasting.connections.reverb.key') }}">
        <meta name="reverb-port" content="{{ config('broadcasting.connections.reverb.client_port') }}">
    @endif
    <title>{{ config('app.name', 'Kebun Kita POS') }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Raleway:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
<body class="bg-[#f7faf8] text-[#14221b] antialiased selection:bg-[#e6f8ef] selection:text-[#007b40]">
    <div id="root"><div style="position:fixed;inset:0;background:linear-gradient(180deg,#0f7a4c 0%,#14906c 42%,#0e6b3e 100%)"></div></div>
</body>
</html>


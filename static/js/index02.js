<script>
    function randomFontEffect() {
        const links = document.querySelectorAll(".feature-item a");
        links.forEach(link => {
            let randomSize = Math.floor(Math.random() * 6) + 20; // 20px - 25px
            let colors = ["#ff4500", "#1a40e9", "#00bcd4", "#ff9800"];
            let randomColor = colors[Math.floor(Math.random() * colors.length)];

            link.style.fontSize = randomSize + "px";
            link.style.color = randomColor;
        });
    }

    setInterval(randomFontEffect, 1000); // 每秒随机变化
</script>

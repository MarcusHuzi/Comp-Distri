window.addEventListener('click', (event) => {

    const playerPosition = {
        x: players[socket.id].x,
        y: players[socket.id].y
    }

    const angle = Math.atan2(
        event.clientX * window.devicePixelRatio - playerPosition.x,
        event.clientY * window.devicePixelRatio - playerPosition.y
    )
    //const velocity = {
    //    x: Math.sin(angle) * 5,
    //    y: Math.cos(angle) * 5
    //}

    socket.emit('shoot', {
        x: playerPosition.x,
        y: playerPosition.y,
        angle
    })

    /*
    projectiles.push(
        new Projectile(playerPosition.x, playerPosition.y, 5, 'white', velocity)
    )*/

})
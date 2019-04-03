exports.getPlayer = (req,res)=>{

    res.render("game/player",{
        title:"Pengu :)",
        id:req.user.id,
        playerName:req.user.email
    })
}
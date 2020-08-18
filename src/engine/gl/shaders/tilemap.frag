precision highp float;

varying vec2 v_texcoord;

uniform sampler2D u_tilemap;
uniform sampler2D u_tiles;
uniform vec2 u_tilemapSize;
uniform vec2 u_tilesetSize;
uniform vec4 u_tint;


void main(){
    vec2 tilemapCoord=floor(v_texcoord);
    vec2 texcoord=fract(v_texcoord);
    vec2 tileFoo=fract((tilemapCoord+vec2(.5,.5))/u_tilemapSize);
    vec4 tile=floor(texture2D(u_tilemap,tileFoo)*256.);
    
    float flags=tile.w;
    float xflip=step(128.,flags);
    flags=flags-xflip*128.;
    float yflip=step(64.,flags);
    flags=flags-yflip*64.;
    float xySwap=step(32.,flags);
    if(xflip>0.){
        texcoord=vec2(1.-texcoord.x,texcoord.y);
    }
    if(yflip>0.){
        texcoord=vec2(texcoord.x,1.-texcoord.y);
    }
    if(xySwap>0.){
        texcoord=texcoord.yx;
    }
    vec2 tileCoord=(tile.xy+texcoord)/u_tilesetSize;
    vec4 color=texture2D(u_tiles,tileCoord);
    if(color.a<=.1){
        discard;
    }
    gl_FragColor=color*u_tint;
}
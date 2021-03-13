import { IEntity } from "../entity";
import { IDisplayComponent } from "../systems/displaySystem";
import { Component } from "./component";
import { SpriteComponent } from "./spriteComponent";

import * as GraphicsAPI from "../graphicsAPI";
import { TextureComponent } from "./textureComponent";

let GL: WebGLRenderingContext;

interface ILayerComponentDesc {
  spriteName?: string;
  isAnimated?: boolean;
  frameSkip?: number;
  animWait?: number;
}

// # Classe *LayerComponent*
// Ce composant représente un ensemble de sprites qui
// doivent normalement être considérées comme étant sur un
// même plan.
export class LayerComponent extends Component<object> implements IDisplayComponent {
  
  private vertexBuffer!: WebGLBuffer;
  private indexBuffer!: WebGLBuffer;
  private vertices!: Float32Array;
  private indexes!: Uint16Array;
  
  // ## Méthode *setup*
  public setup(descr: ILayerComponentDesc) {
    GL = GraphicsAPI.context;
    this.vertexBuffer = GL.createBuffer()!;
    this.indexBuffer = GL.createBuffer()!;
  }

  // ## Méthode *display*
  // La méthode *display* est appelée une fois par itération
  // de la boucle de jeu.
	public display(dT: number) {
    const layerSprites = this.listSprites();

    if (layerSprites.length === 0) {
      return;
    }

    const spriteSheet = layerSprites[0].spriteSheet;
    
    const indices = new Uint16Array(6 * layerSprites.length);
    const vertices = new Float32Array(4 * layerSprites.length * TextureComponent.vertexSize);
    
    let count = 0;
    for(const sprite of layerSprites){
      vertices.set(sprite.getVertices(), count * 4 * TextureComponent.vertexSize);
      indices.set(new Uint16Array([4*count, 4*count+1, 4*count+2, 4*count+2, 4*count+3, 4*count]), count * 6);
      count++;
    }

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, indices, GL.DYNAMIC_DRAW);
    GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, vertices, GL.DYNAMIC_DRAW);
    spriteSheet.bind();
    GL.drawElements(GL.TRIANGLES, 6*count, GL.UNSIGNED_SHORT, 0);
    spriteSheet.unbind();
  }

  // ## Fonction *listSprites*
  // Cette fonction retourne une liste comportant l'ensemble
  // des sprites de l'objet courant et de ses enfants.
  private listSprites() {
    const sprites: SpriteComponent[] = [];

    const queue: IEntity[] = [this.owner];
    while (queue.length > 0) {
      const node = queue.shift() as IEntity;
      for (const child of node.children) {
        if (child.active) {
          queue.push(child);
        }
      }

      for (const comp of node.components) {
        if (comp instanceof SpriteComponent && comp.enabled) {
          sprites.push(comp);
        }
      }
    }

    return sprites;
  }
}

import nameToEmoji from "gemoji/name-to-emoji.json";
import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token";

export default function image(md: MarkdownIt) {
  md.core.ruler.after("inline", "image", state => {
    let tokens = state.tokens;
    // console.log('这里是自定义的图片规则', tokens, state);


    let removePArr:Token[] = []
    let releaseImgArr:Token[] = []
    tokens.forEach((token, index) => {
      // 我们将通过一系列复杂的条件判断来严格的判定即将插入的是一个图片
      if(token.type === "inline" && token.children && token.children[0] && token.children[0].type === 'image'){
        let preToken = tokens[index - 1]
        let nextToken = tokens[index + 1]
        if(preToken && nextToken && preToken.type === "paragraph_open" && nextToken.type === "paragraph_close"){
          if( preToken.tag === "p" && nextToken.tag === "p") {
            // 将图片组和p标签分别加入释放队列和删除队列
            releaseImgArr.push(token)
            removePArr.push(preToken, nextToken)
          }
        }
      }
    })
    // 删掉图片前后的p标签，然后把图片从span中暴露出来
    tokens = tokens.filter(x => !removePArr.includes(x))
    tokens = tokens.reduce((a, b) => {
      if(releaseImgArr.includes(b)) {
        // 过滤掉除图片之外的其他标签
        let images = (b.children || []).filter(y => y.type === 'image')
        // 给每个图片插入一个介绍文本内容
        images.map(y => {
          if(y.children?.[0] && y.children[0].type === 'text'){
            y.children[0].content = y.children[0].content || 'Write a image caption'
          }
        })
        // 给每个图片之间插入一个换行
        images = images.reduce((a,b) => {
          a.push(b, new Token("paragraph_open", 'p', -1), new Token("paragraph_close", 'p', 1))
          return a
        }, new Array<Token>())
        images.pop()
        images.pop()

        return a.concat(...images)
      }
      a.push(b)
      return a
    }, new Array<Token>())
    // console.log('这里是自定义的图片规则2:', tokens)
    state.tokens = tokens
    
    return false;
  })
}
